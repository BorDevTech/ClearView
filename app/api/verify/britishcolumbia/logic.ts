import { VetResult } from "@/app/types/vet-result";

export async function verify({
  firstName,
  lastName,
  licenseNumber
}: {
  firstName: string;
  lastName: string;
  licenseNumber: string;
}): Promise<VetResult[]> {
  const key = "britishcolumbia";
  console.log("British Columbia Loaded");

  type RawVetEntry = {
    id: string;
    name: string;
    preferredName: string;
    class: string;
    licenseStatus: string;
    licenseType: string;
    specialty: string;
    notes: string;
    licenseNumber: string;
  };

  function parseBlob(raw: RawVetEntry[] | { blob?: RawVetEntry[]; results: RawVetEntry[] }): RawVetEntry[] {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.blob)) return raw.blob;
    if (Array.isArray(raw.results)) return raw.results;
    return [];
  }

  function filterEntries(entries: RawVetEntry[]): VetResult[] {
    return entries.filter(entry => {
      const matchesLicense = licenseNumber
        ? entry.licenseNumber?.toLowerCase().includes(licenseNumber.toLowerCase())
        : true;

      const matchesName = firstName || lastName
        ? (() => {
          const nameLower = entry.name.toLowerCase();
          const firstMatches = firstName ? nameLower.includes(firstName.toLowerCase()) : true;
          const lastMatches = lastName ? nameLower.includes(lastName.toLowerCase()) : true;
          return firstMatches && lastMatches;
        })()
        : true;

      return matchesLicense && matchesName;
    });
  }

  const res = await fetch(`/api/verify/${key}`, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to fetch ${key} data`);

  const rawData = await res.json();
  const parsedData = parseBlob(rawData);
  return filterEntries(parsedData);
}
