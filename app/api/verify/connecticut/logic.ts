import { VetResult } from "@/app/types/vet-result";

interface VetRecord {
  last_name: string;
  first_name: string;
  status: string;
  license_number: string;
  current: string;
  issue_date: string;
  expiration_date: string;
  formatted_name: string;
}

function buildFullName(record: VetRecord): string {
  const parts = [record.first_name?.trim(), record.last_name?.trim()].filter(
    Boolean
  );
  return parts.join(" ");
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
    status: string;
    license_number: string;
    issue_date: string;
    current: string;
    expiration_date: string;
    formatted_name: string;
  };
  const key = "connecticut";
  // 🔍 Internal helper: parse blob response
  function parseBlob(raw: any): RawVetEntry[] {
    return Array.isArray(raw) ? raw : raw.blob ?? [];
  }

  // 🧠 Internal helper: filter and transform entries
  function filterEntries(entries: RawVetEntry[]): VetResult[] {
    // 🧹 Normalize and map entries
    return entries
      .filter((entry) => {
        const isVet = entry.current?.trim() === "CURRENT" && entry.status?.trim() === "Active";
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
        status: entry.status?.trim(),
        issued: new Date(entry.issue_date).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }),
        expiration: new Date(entry.expiration_date).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
      }));
  }
  const res = await fetch(`/api/verify/${key}`, {
    method: "GET",
  });

  if (!res.ok) throw new Error(`Failed to fetch ${key} data`);
  const rawData = await res.json();
  const parsedData = parseBlob(rawData);
  const results = filterEntries(parsedData);
  return results;
}
