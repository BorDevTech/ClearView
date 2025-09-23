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
  const key = "alabama";
  console.log("Alabama Loaded");

  type RawVetEntry = {

    LAST_NAME: string;
    FIRST_NAME: string;
    TYPE: string;
    LIC_NUMBER: string;
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
          ? entry.LIC_NUMBER?.toLowerCase().includes(licenseNumber.toLowerCase())
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
        licenseNumber: entry.LIC_NUMBER?.trim(),
        status: "Active",
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

// function parse(html: string): VetResult[] {
//   const parser = new DOMParser();
//   const doc = parser.parseFromString(html, "text/html");
//   const rows = Array.from(doc.querySelectorAll("#myDataTable tbody tr"));
//   const filtered = rows
//     .filter(row => row.querySelector("td")?.textContent?.includes(" - DVM"))
//     .map(row => {
//       const cells = row.querySelectorAll("td");
//       return {
//         name: cells[0]?.textContent?.trim() || "",
//         licenseNumber: cells[1]?.textContent?.trim() || "",
//         issuedDate: cells[2]?.textContent?.trim() || "",
//         expirationDate: cells[3]?.textContent?.trim() || "",
//         detailsUrl: cells[4]?.querySelectorAll("a")[0]?.getAttribute("href") || "",
//         reportUrl: cells[4]?.querySelectorAll("a")[1]?.getAttribute("href") || "",
//         status: "active",
//         expiration: cells[3]?.textContent?.trim() || "",
//       } as VetResult;
//     });
//   console.log(`🔍 Parsed Alabama vet data: ${filtered}`);
//   return filtered;
// }

// async function verify(html: string,
//   { firstName, lastName, licenseNumber }:
//     { firstName?: string, lastName?: string, licenseNumber?: string },
// ): Promise<VetResult[]> {
//   const queryParams = new URLSearchParams({
//     firstname: firstName || "",
//     license: licenseNumber || "",
//     lastname: lastName || "",
//     business: "",
//     city: "",
//     zipcode: "null",
//   });


// try {
//   const res = await fetch(`/api/verify/alabama?${queryParams.toString()}`);
//   if (!res.ok) {
//     throw new Error(`Network response was not ok: ${res.status}`);
//   }

//   const html = await res.text();

//   // Parse HTML (Alabama-specific for now)
//   const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gs;
//   const cellRegex = /<td[^>]*>(.*?)<\/td>/gs;

//   const results: VetResult[] = [];
//   const rows = html.match(rowRegex) || [];

//   for (const row of rows) {
//     const cells = [...row.matchAll(cellRegex)].map(match => match[1].trim());

//     // Only process rows with at least 4 cells
//     if (cells.length >= 4) {
//       const [name, license, , expiration] = cells;

//       // Filter: must have name, license, and expiration, and name must end with "DVM"
//       if (
//         name &&
//         license &&
//         expiration &&
//         /\bDVM\b$/i.test(name)
//       ) {
//         results.push({
//           name: name.replace(/\s*-\s*DVM$/i, ""), // Remove " - DVM" suffix for display
//           licenseNumber: license,
//           expiration,
//           status: "Active", // Assuming status is always "Active" for this example
//         });
//       }
//     }
//   }
//   return results;
// } catch (error) {
//   console.error("Error fetching Alabama vet data:", error);
//   try {


// const res = await fetch(`/api/verify/alabama?${queryParams.toString()}`);
// if (!res.ok) throw new Error("Failed to fetch");
// const { results } = await res.json();
// console.log(`logging VERIFIED results:`, results);
// console.log(`logging VERIFIED results amount:`, results[0]);
// const data = await res.text();
// Parse the HTML using DOMParser (Edge Runtime or browser)
// const parser = new DOMParser();
// const doc = parser.parseFromString(data, "text/html");
// const rows = Array.from(doc.querySelectorAll("#myDataTable tbody tr"));

// // Filter for names containing " - DVM"
// const filteredRows = rows.filter((row) => {
//   const cells = row.querySelectorAll("td");
//   const name = cells[0]?.textContent?.trim() || "";
//   return name.includes(" - DVM");
// });

// Map each filtered row to a VetResult
// const parsed = parse(data);
// console.log(`🔍 Parsed Alabama vet data: ${parsed}`);
// return parsed;

// }
// verify.parse = parse;

// export { verify }