// "use server";
// import { VetResult } from "@/app/types/vet-result";
// import pdf from "pdf-parse";

// export async function verify({
//   firstName,
//   lastName,
//   licenseNumber,
// }: {
//   firstName: string;
//   lastName: string;
//   licenseNumber: string;
// }): Promise<VetResult[]> {
//   const url =
//     "https://mydatcp.wi.gov/documents/dah/VEBRegistries_VeterinarianLicense.pdf";
//   const res = await fetch(url);
//   if (!res.ok) throw new Error("Failed to fetch PDF");
//   const pdfBuffer = await res.arrayBuffer();
//   // Parse PDF text
//   const data = await pdf(Buffer.from(pdfBuffer));
//   const text = data.text;

//   // Example: split into lines and try to extract table rows
//   const lines = text
//     .split("\n")
//     .map((l: string) => l.trim())
//     .filter(Boolean);
//   const tableStart = lines.findIndex((line: string) =>
//     line.startsWith("Credential #")
//   );
//   if (tableStart === -1) return [];

//   // Get only the table lines (skip header)
//   const tableLines = lines.slice(tableStart + 1);

//   // Map each line to a VetResult (very basic splitting, may need tuning)
//   const results: VetResult[] = tableLines
//     .map((line: string) => {
//       // Example line: 404352 1276 Bourie, Richard D New Glarus WI Veterinary Medicine 06/10/1973
//       // Split by multiple spaces
//       const parts = line.split(/\s{2,}/);
//       if (parts.length < 7) return null;
//       return {
//         name: parts[2], // Legal Name
//         licenseNumber: parts[0], // Credential #
//         status: "", // Not present in this table
//         expiration: "", // Not present in this table
//         licenseType: parts[5], // Credential Type
//       };
//     })
//     .filter(Boolean) as VetResult[];

//   return results;
// }
