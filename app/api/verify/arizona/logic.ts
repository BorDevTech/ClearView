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
    SEARCH_ID: string,
    FIRST_NAME: string,
    LAST_NAME: string,
    LICENSE_TYPE: string,
    LICENSE_NUMBER: string,
    LICENSE_STATUS: string,
    LICENSE_EXPIRY_DATE: string

  };

  console.log("Arizona Loaded");
  const key = "arizona";

  // 🔍 Internal helper: parse blob response
  function parseBlob(raw: RawVetEntry[] | { blob?: RawVetEntry[] }): RawVetEntry[] {
    return Array.isArray(raw) ? raw : raw.blob ?? [];
  }

  // 🧠 Internal helper: filter and transform entries
  function filterEntries(entries: RawVetEntry[]): VetResult[] {
    // 🧹 Normalize and map entries
    return entries
      .filter((entry) => {
        const isVet = entry.LICENSE_TYPE?.trim().includes("Veterinarian") && entry.LICENSE_STATUS?.trim() === "Active";
        if (!isVet) return false;

        const matchesLicense = licenseNumber
          ? entry.LICENSE_NUMBER?.toLowerCase().includes(licenseNumber.toLowerCase())
          : true;

        let matchesName = true;
        if (firstName) {
          matchesName =
            typeof entry.FIRST_NAME === "string" &&
            entry.FIRST_NAME.toLowerCase().startsWith(firstName.toLowerCase());
        }
        if (matchesName && lastName) {
          matchesName =
            typeof entry.LAST_NAME === "string" &&
            entry.LAST_NAME.toLowerCase().startsWith(lastName.toLowerCase());
        }

        return matchesLicense && matchesName;

      })
      .map((entry) => ({
        name: `${entry.FIRST_NAME} ${entry.LAST_NAME}`.trim(),
        licenseNumber: entry.LICENSE_NUMBER?.trim(),
        status: entry.LICENSE_STATUS?.trim(),
        expiration: new Date(entry.LICENSE_EXPIRY_DATE).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
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

// const keyword = [licenseNumber, firstName, lastName].filter(Boolean).join(" ").trim();

// const queryParams = new URLSearchParams({
//   keyword,
//   skip: "0",
//   take: "20000",
//   lang: "en-us",
//   licenseType: "Veterinarian (Regular)",
//   licenseStatus: "Active",
//   disciplined: "false",
// }); type ArizonaEntry = {
//   columnValues: { data: string }[];
// };


// const res = await fetch(`/api/verify/arizona/?${queryParams.toString()}`);
// if (!res.ok) throw new Error("Failed to fetch Arizona data");

// const data = await res.json();
// const rawResults = data?.result?.dataResults || [];

// const results: VetResult[] = rawResults.map((entry: ArizonaEntry) => {
//   const licenseNumber = entry.columnValues?.[0]?.data || "";
//   const first = entry.columnValues?.[1]?.data || "";
//   const last = entry.columnValues?.[2]?.data || "";
//   const name = `${first} ${last}`.trim();

//   return {
//     name,
//     licenseNumber,
//     issuedDate: "",
//     expirationDate: "",
//     detailsUrl: "",
//     reportUrl: "",
//     status: "active",
//     expiration: "",
//   };
// });

// await BlobSync("arizona", results);
// return results;
// }


