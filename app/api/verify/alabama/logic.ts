import { VetResult } from "@/app/types/vet-result";

export async function verify(
  { firstName, lastName, licenseNumber }:
    { firstName: string, lastName: string, licenseNumber: string }
): Promise<VetResult[]> {

  const queryParams = new URLSearchParams({
    FirstName: firstName,
    LastName: lastName,
    LicenseNumber: licenseNumber
  });

  try {
    const res = await fetch(`https://supreme-guacamole-6wjw97ggrr535xgp-3000.app.github.dev/api/verify/alabama?${queryParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Network response was not ok: ${res.status}`);
    }

    const html = await res.text();

    // Parse HTML (Alabama-specific for now)
    const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gs;
    const cellRegex = /<td[^>]*>(.*?)<\/td>/gs;

    const results: VetResult[] = [];
    const rows = html.match(rowRegex) || [];

    for (const row of rows) {
      const cells = [...row.matchAll(cellRegex)].map(match => match[1].trim());

      // Only process rows with at least 4 cells
      if (cells.length >= 4) {
        const [name, license, , expiration] = cells;

        // Filter: must have name, license, and expiration, and name must end with "DVM"
        if (
          name &&
          license &&
          expiration &&
          /\bDVM\b$/i.test(name)
        ) {
          results.push({
            name: name.replace(/\s*-\s*DVM$/i, ""), // Remove " - DVM" suffix for display
            licenseNumber: license,
            expiration,
            status: "Active", // Assuming status is always "Active" for this example
          });
        }
      }
    }

    return results;

  } catch (error) {
    console.error("Error fetching Alabama vet data:", error);
    return [];
  }
}