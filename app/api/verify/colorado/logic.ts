import { VetResult } from "@/app/types/vet-result";
import BlobSync from "@/data/controls/blobs/blobSync";

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

function buildFullName(record: VetRecord): string {
  const parts = [
    record.first_name?.trim(),
    record.middle_name?.trim(),
    record.last_name?.trim(),
    record.suffix?.trim(),
  ].filter(Boolean);
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



// const queryParams = new URLSearchParams({
//   firstname: firstName || "",
//   license: licenseNumber || "",
//   lastname: lastName || "",
// });



// const res = await fetch(`/api/verify/colorado?${queryParams.toString()}`);
// if (!res.ok) throw new Error("Failed to fetch VET.json from GitHub");

// const data: VetRecord[] = await res.json();

// const firstNameLower = firstName.toLowerCase();
// const lastNameLower = lastName.toLowerCase();
// const licenseNumberLower = licenseNumber.toLowerCase();

// const filtered = data.filter((record) => {
//   if (
//     licenseNumber &&
//     record.license_number.toLowerCase() !== licenseNumberLower
//   ) {
//     return false;
//   }
//   if (lastName && !record.last_name.toLowerCase().includes(lastNameLower)) {
//     return false;
//   }
//   if (
//     firstName &&
//     !record.first_name.toLowerCase().includes(firstNameLower)
//   ) {
//     return false;
//   }
//   return true;
// });

// const results = filtered.map((record) => ({
//   name: record.formatted_name?.trim() || buildFullName(record),
//   status: record.license_status_description || "",
//   expirationDate: record.license_expiration_date,
//   licenseNumber: record.license_number,
//   expiration: record.license_expiration_date,
// }));
// await BlobSync("colorado", results);
// return results;
// }
