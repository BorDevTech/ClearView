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
  function parseBlob(raw: RawVetEntry[] | { blob?: RawVetEntry[]; results: RawVetEntry[] }): RawVetEntry[] {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.blob)) return raw.blob;
    if (Array.isArray(raw.results)) return raw.results;
    return [];
  }

  // 🧠 Internal helper: filter and transform entries
  function filterEntries(entries: RawVetEntry[]): VetResult[] {
    return entries
      .filter((entry) => {
        const isVet = entry.license_type?.toLowerCase().includes("vet");
        if (!isVet) return false;

        const matchesLicense = licenseNumber
          ? entry.license_num?.toLowerCase().includes(licenseNumber.toLowerCase())
          : true;



        const matchesName = firstName || lastName
          ? (() => {
            // Use FIRST_NAME if available, otherwise LAST_NAME
            const name = (entry.first_name || entry.last_name || "").trim();
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
        name: `${entry.first_name} ${entry.last_name}`.trim(),
        licenseNumber: entry.license_num?.trim(),
        status: "Active",
        license_issue_date: entry.license_issue_date?.trim(),
        license_expiration_date: entry.license_expiration_date?.trim()
      }));
  }


  // async function fetchDetailedReport(entry: RawVetEntry): Promise<VetResult> {
  //   const licenseNumber = entry.license_num?.trim() ?? "";
  //   const url = `https://mip.agri.arkansas.gov/VetLicensingPortal/Guest/Home/Get_Licensee_Info?id=${licenseNumber}`;
  //   let expirationDate: string | null = null;
  //   try {
  //     const res = await fetch(url);
  //     if (res.ok) {
  //       const data = await res.json();
  //       expirationDate = data.lexpdate?.trim() ?? null;
  //     }
  //     else {
  //       console.warn(`⚠️ Failed to fetch detailed report for license ${licenseNumber}: ${res.status} ${res.statusText}`);

  //     }
  //   } catch (error) {
  //     console.warn(`❌ Error fetching expiration for ${licenseNumber}:`, error);

  //   } return {
  //     name: `${entry.first_name} ${entry.last_name}`.trim(),
  //     licenseNumber,
  //     status: entry.license_status?.trim(),
  //     expiration: expirationDate ??
  //       new Date(entry.license_expiration_date).toLocaleDateString("en-US", {
  //         timeZone: "UTC",
  //         year: "numeric",
  //         month: "short",
  //         day: "numeric",
  //       }),
  //   };

  // }
  // // 🧠 Internal helper: filter and transform entries
  // async function filterEntries(entries: RawVetEntry[]): Promise<VetResult[]> {
  //   // 🧹 Normalize and map entries

  //   const filtered = entries
  //     .filter((entry) => {
  //       const isVet = entry.license_type?.trim() === "Vet" && entry.license_status?.trim() === "Active";
  //       if (!isVet) return false;

  //       const matchesLicense = licenseNumber
  //         ? entry.license_num?.toLowerCase().includes(licenseNumber.toLowerCase())
  //         : true;

  //       let matchesName = true;
  //       if (firstName) {
  //         matchesName =
  //           typeof entry.first_name === "string" &&
  //           entry.first_name.toLowerCase().startsWith(firstName.toLowerCase());
  //       }
  //       if (matchesName && lastName) {
  //         matchesName =
  //           typeof entry.last_name === "string" &&
  //           entry.last_name.toLowerCase().startsWith(lastName.toLowerCase());
  //       }

  //       return matchesLicense && matchesName;

  //     })


  //   return await Promise.all(filtered.map(fetchDetailedReport));
  // }

  const res = await fetch(`/api/verify/${key}`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(`Failed to fetch ${key} data`);
  const rawData = await res.json();
  const parsedData = parseBlob(rawData);
  const results = await filterEntries(parsedData);
  return results;
}
