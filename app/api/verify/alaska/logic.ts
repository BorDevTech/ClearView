import { VetResult } from "@/app/types/vet-result";

export async function verify({
  firstName,
  lastName,
  licenseNumber,
}: {
  firstName: string;
  lastName: string;
  licenseNumber: string;
}): Promise<VetResult[]> {
  console.log("Alaska Loaded");

  type RawVetEntry = {
    Program: string;
    ProfType: string;
    LicenseNum: string;
    DBA: string;
    Owners: string;
    Status: string;
    DateIssued: string;
    DateEffective: string;
    DateExpired: string;
    ADDRESS1: string;
    ADDRESS2: string;
    CITY: string;
    STATE: string;
    ZIP: string;
  };

  // 🔍 Internal helper: parse blob response
  function parseBlob(raw: RawVetEntry[] | { blob?: RawVetEntry[] }): RawVetEntry[] {
    return Array.isArray(raw) ? raw : raw.blob ?? [];
  }

  // 🧠 Internal helper: filter and transform entries
  function filterEntries(entries: RawVetEntry[]): VetResult[] {
    return entries
      .filter((entry) => {
        const isVet = entry.Program?.trim() === "Veterinary" && entry.ProfType?.trim() === "Veterinarian";
        if (!isVet) return false;

        const matchesLicense = licenseNumber
          ? entry.LicenseNum?.toLowerCase().includes(licenseNumber.toLowerCase())
          : true;



        const matchesName = firstName || lastName
          ? (() => {
            // Use DBA if available, otherwise Owners
            const name = (entry.DBA || entry.Owners || "").trim();
            const [dbaFirst, ...dbaRest] = name.split(" ");
            const dbaLast = dbaRest.length > 0 ? dbaRest[dbaRest.length - 1] : "";

            let firstMatches = true;
            let lastMatches = true;

            if (firstName) {
              firstMatches = dbaFirst?.toLowerCase().startsWith(firstName.toLowerCase());
            }
            if (lastName) {
              lastMatches = dbaLast?.toLowerCase().startsWith(lastName.toLowerCase());
            }

            return firstMatches && lastMatches;
          })()
          : true;

        return matchesLicense && matchesName;
      })
      .map((entry) => ({
        name: entry.DBA || entry.Owners || "Unknown",
        licenseNumber: entry.LicenseNum?.trim(),
        status: entry.Status?.trim(),
        issued: new Date(entry.DateIssued).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }),
        expiration: new Date(entry.DateExpired).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
      }));
  }


  const res = await fetch("/api/verify/alaska", {
    method: "GET",
  });

  if (!res.ok) throw new Error("Failed to fetch Alaska data");
  const rawData = await res.json();
  const parsedData = parseBlob(rawData);
  const results = filterEntries(parsedData);
  return results;
}
