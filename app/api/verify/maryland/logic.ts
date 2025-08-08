import { VetResult } from "@/app/types/vet-result";
import BlobSync from "@/data/controls/blobs/blobSync";

export async function verify(
  firstName: string,
  lastName: string,
  licenseNumber: string
): Promise<VetResult[]> {
  // Prepare the POST body (JSON)
  const body = JSON.stringify({ firstName, lastName, licenseNumber });

  // Call your Next.js Maryland API route
  const res = await fetch("/api/verify/maryland/route", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  if (!res.ok) throw new Error("Failed to fetch");

  const data = await res.json();

  // Defensive: check for expected structure
  if (!data.entries || !Array.isArray(data.entries)) return [];

  // Define a type for the Maryland API response entry
  type MarylandEntry = {
    view_data?: {
      content_element_data?: { [key: string]: string };
    };
  };

  // Map Maryland's JSON structure to VetResult[]
  const results: VetResult[] = data.entries.map((entry: MarylandEntry) => {
    // Extract name and status from view_data.content_element_data
    const content = entry.view_data?.content_element_data || {};
    // Get the first key for name, second for status (as in your screenshot)
    const keys = Object.keys(content);
    const name = keys.length > 0 ? content[keys[0]] : "";
    const status = keys.length > 1 ? content[keys[1]] : "";

    // You may need to adjust these fields based on actual data
    return {
      name: name ?? "",
      licenseNumber: "", // Maryland data may not have this directly
      status: status ?? "",
      expiration: "", // Add if available in the JSON
      licenseType: "", // Add if available in the JSON
    };
  });

  await BlobSync("maryland", results);
  return results;
}
