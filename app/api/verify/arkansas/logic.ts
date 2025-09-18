import { VetResult } from "@/app/types/vet-result";

interface VetRecord {
  first_name: string
  last_name: string
  work_city: string
  state: string
  license_num: string
  license_type: string
  license_status: string
  license_issue_date: string
  license_expiration_date: string
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
    first_name: string
    last_name: string
    work_city: string
    state: string
    license_num: string
    license_type: string
    license_status: string
    license_issue_date: string
    license_expiration_date: string
  };
  const key = "arkansas";
  // 🔍 Internal helper: parse blob response
  function parseBlob(raw: any): RawVetEntry[] {
    return Array.isArray(raw) ? raw : raw.blob ?? [];
  }
  async function fetchDetailedReport(entry: RawVetEntry): Promise<VetResult> {
    const licenseNumber = entry.license_num?.trim() ?? "";
    const url = `https://mip.agri.arkansas.gov/VetLicensingPortal/Guest/Home/Get_Licensee_Info?id=${licenseNumber}`;
    let expirationDate: string | null = null;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        expirationDate = data.lexpdate?.trim() ?? null;
      }
      else {
        console.warn(`⚠️ Failed to fetch detailed report for license ${licenseNumber}: ${res.status} ${res.statusText}`);

      }
    } catch (error) {
      console.warn(`❌ Error fetching expiration for ${licenseNumber}:`, error);

    } return {
      name: `${entry.first_name} ${entry.last_name}`.trim(),
      licenseNumber,
      status: entry.license_status?.trim(),
      expiration: expirationDate ??
        new Date(entry.license_expiration_date).toLocaleDateString("en-US", {
          timeZone: "UTC",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    };

  }
  // 🧠 Internal helper: filter and transform entries
  async function filterEntries(entries: RawVetEntry[]): Promise<VetResult[]> {
    // 🧹 Normalize and map entries

    const filtered = entries
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

      })


    return await Promise.all(filtered.map(fetchDetailedReport));
  }

  const res = await fetch(`/api/verify/${key}`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(`Failed to fetch ${key} data`);
  const rawData = await res.json();
  const parsedData = parseBlob(rawData);
  const results = await filterEntries(parsedData);
  console.log("parsed results: ", results)
  return results;
}
