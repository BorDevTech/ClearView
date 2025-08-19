import { VetResult } from "@/app/types/vet-result";

interface VetRecord {
  last_name: string;
  first_name: string;
  middle_name: string;
  suffix: string;
  license_number: string;
  license_first_issue_date: string;
  license_expiration_date: string;
  license_status_description: string;
  title: string;
  formatted_name: string;
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
    last_name: string;
    first_name: string;
    middle_name: string;
    suffix: string;
    license_number: string;
    license_first_issue_date: string;
    license_expiration_date: string;
    license_status_description: string;
    title: string;
    formatted_name: string;
  };
  const key = "colorado";

  // 🔍 Internal helper: parse blob response
  function parseBlob(raw: any): RawVetEntry[] {
    return Array.isArray(raw) ? raw : raw.blob ?? [];
  }

  // 🧠 Internal helper: filter and transform entries
  function filterEntries(entries: RawVetEntry[]): VetResult[] {
    // 🧹 Normalize and map entries
    return entries
      .filter((entry) => {
        const isVet = entry.title?.trim() === "Doctor of Veterinary Medicine" && entry.license_status_description?.trim() === "Active";
        if (!isVet) return false;

        const matchesLicense = licenseNumber
          ? entry.license_number?.toLowerCase().includes(licenseNumber.toLowerCase())
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
      .map((entry) => ({
        name: `${entry.first_name} ${entry.last_name}`.trim(),
        licenseNumber: entry.license_number?.trim(),
        status: entry.license_status_description?.trim(),
        issued: new Date(entry.license_first_issue_date).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }),
        expiration: new Date(entry.license_expiration_date).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
      }));
  } const res = await fetch(`/api/verify/${key}`, {
    method: "GET",
  });

  if (!res.ok) throw new Error(`Failed to fetch ${key} data`);
  const rawData = await res.json();
  const parsedData = parseBlob(rawData);
  const results = filterEntries(parsedData);
  return results;
}