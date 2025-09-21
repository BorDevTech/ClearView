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
  console.log("Alberta Loaded");

  type RawVetEntry = {

    LAST_NAME: string;
    FIRST_NAME: string;
    TYPE: string;
    LICENSE: string;
  };

  // 🔍 Internal helper: parse blob response
  function parseBlob(raw: RawVetEntry[] | { blob?: RawVetEntry[] }): RawVetEntry[] {
    return Array.isArray(raw) ? raw : raw.blob ?? [];
  }

  // 🧠 Internal helper: filter and transform entries
  function filterEntries(entries: RawVetEntry[]): VetResult[] {
    return entries
      .filter((entry) => {
        const isVet = entry.TYPE?.toLowerCase().includes("veterinarian");
        if (!isVet) return false;

        const matchesLicense = licenseNumber
          ? entry.LICENSE?.toLowerCase().includes(licenseNumber.toLowerCase())
          : true;



        const matchesName = firstName || lastName
          ? (() => {
            // Use FIRST_NAME if available, otherwise LAST_NAME
            const name = (entry.FIRST_NAME || entry.LAST_NAME || "").trim();
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
        name: `${entry.FIRST_NAME} ${entry.LAST_NAME}`.trim(),
        licenseNumber: entry.LICENSE?.trim(),
        status: "Active",
      }));
  }


  const res = await fetch("/api/verify/alberta", {
    method: "GET",
  });

  if (!res.ok) throw new Error("Failed to fetch Alberta data");
  const rawData = await res.json();
  const parsedData = parseBlob(rawData);
  const results = filterEntries(parsedData);
  return results;
}
