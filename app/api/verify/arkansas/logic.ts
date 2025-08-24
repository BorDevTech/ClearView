import { VetResult } from "@/app/types/vet-result";

interface VetRecord {
  first_name: string;
  last_name: string;
  work_city: string;
  state: string;
  license_num: string;
  license_type: string;
  license_status: string;
  license_issued: string;
  license_expiration: string;
}

export async function verify({
  firstName,
  lastName,
  licenseNumber,
}: {
  firstName: string;
  lastName: string;
  licenseNumber: string;
}): Promise<VetResult[]> {

  type RawVetEntry = {
    first_name: string;
    last_name: string;
    work_city: string;
    state: string;
    license_num: string;
    license_type: string;
    license_status: string;
    license_issued: string;
    license_expiration: string;
  };
  const key = "arkansas";

  // 🔍 Internal helper: parse blob response
  function parseBlob(raw: any): RawVetEntry[] {
    return Array.isArray(raw) ? raw : raw.blob ?? [];
  }

  async function fetchLicenseDetails(licenseNum: string): Promise<{
    license_issued?: string;
    license_expiration?: string;
  }> {
    try {
      const res = await fetch(`https://mip.agri.arkansas.gov/VetLicensingPortal/api/license/${licenseNum}`);
      if (!res.ok) throw new Error(`Failed for ${licenseNum}`);
      const data = await res.json();
      return {
        license_issued: data.lic_orig_issue_date,
        license_expiration: data.lic_exp_date,
      };
    } catch (err) {
      console.warn(`⚠️ License fetch failed for ${licenseNum}:`, err);
      return {};
    }
  }



  // 🧠 Internal helper: filter and transform entries
  function filterEntries(entries: RawVetEntry[]): RawVetEntry[] {
    // 🧹 Normalize and map entries
    return entries
      .filter((entry) => {
        const isVet = entry.license_type?.trim() === "Vet" && entry.license_status?.trim() === "Active";
        if (!isVet) return false;

        const matchesLicense = licenseNumber
          ? entry.license_num?.toLowerCase().includes(licenseNumber.toLowerCase())
          : true;

        let matchesName = true;
        if (firstName) {
          matchesName =
            typeof entry.first_name === "string" &&
            entry.first_name.toLowerCase().startsWith(firstName.toLowerCase());
        }
        if (matchesName && lastName) {
          matchesName =
            typeof entry.last_name === "string" &&
            entry.last_name.toLowerCase().startsWith(lastName.toLowerCase());
        }

        return matchesLicense && matchesName;
      });

  }


  const res = await fetch(`/api/verify/${key}`, {
    method: "GET",
  });

  if (!res.ok) throw new Error(`Failed to fetch ${key} data`);
  const rawData = await res.json();
  const parsedData = parseBlob(rawData);
  const filteredEntries = filterEntries(parsedData);

  // Fetch license details for each entry and merge
  const results: VetResult[] = await Promise.all(
    filteredEntries.map(async (entry) => {
      const details = await fetchLicenseDetails(entry.license_num);
      return {
        name: `${entry.first_name} ${entry.last_name}`.trim(),
        licenseNumber: entry.license_num?.trim(),
        status: entry.license_status?.trim(),
        issued: details.license_issued
          ? new Date(details.license_issued).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
          : entry.license_issued
            ? new Date(entry.license_issued).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
            : "",
        expiration: details.license_expiration
          ? new Date(details.license_expiration).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
          : entry.license_expiration
            ? new Date(entry.license_expiration).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
            : "",
      };
    })
  );
  return results;
} 