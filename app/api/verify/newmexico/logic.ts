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
  console.log("New Mexico Loaded");
  //filter recieved input to determine search type
  const isLicenseNumberSearch = licenseNumber && licenseNumber.trim() !== "";

  // Build query params and form data
  const queryParams = new URLSearchParams({
    sobi2Search: isLicenseNumberSearch
      ? licenseNumber
      : `${firstName + " " + lastName}`.trim(),
    searchphrase: "any",
    option: "com_sobi2",
    Itemid: "0",
    no_html: "1",
    sobi2Task: "axSearch",
    sobiCid: "0",
    SobiSearchPage: "0",
  });

  // ...append all other required fields as in your previous logic...

  // Call your Next.js API route (which proxies to the real DBPR site)
  console.log("Outgoing query params:", queryParams.toString());

  const res = await fetch(`/api/verify/newmexico/?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  console.log("API response status:", res);
  if (!res.ok) throw new Error("Failed to fetch");
  const html = await res.text();

  // --- Parsing logic (as in your page.tsx) ---
  const innerTableMatch = html.match(
    /<table[^>]*bgcolor="#ffffff"[\s\S]*?<\/table>/i
  );
  if (!innerTableMatch) return [];

  const innerTable = innerTableMatch[0];

  // Find the nested table inside the innerTable
  const nestedTableMatch = innerTable.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!nestedTableMatch) return [];

  const nestedTable = nestedTableMatch[0];

  // Get all <tr> rows inside the nested table
  const rows = [...nestedTable.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];

  // The first row is the header, so skip it
  if (rows.length < 2) return [];

  const results: VetResult[] = rows
    .slice(1)
    .map((rowMatch) => {
      const dataRow = rowMatch[1];
      const tdMatches = [...dataRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
      if (tdMatches.length < 7) return null;

      const licenseNumber = tdMatches[0][1].replace(/<[^>]+>/g, "").trim();
      const licenseType = tdMatches[1][1].replace(/<[^>]+>/g, "").trim();
      const statusRaw = tdMatches[2][1].replace(/<[^>]+>/g, "").trim();
      const status = statusRaw === "AC" ? "Current, Active" : statusRaw;
      const name = tdMatches[3][1].replace(/<[^>]+>/g, "").trim();
      const location = tdMatches[4][1].replace(/<[^>]+>/g, "").trim();
      const issued = tdMatches[5][1].replace(/<[^>]+>/g, "").trim();
      const expiration = tdMatches[6][1].replace(/<[^>]+>/g, "").trim();

      if (!name || !expiration) return null;
      return {
        name,
        licenseNumber,
        status,
        expiration,
        licenseType,
        location,
        issued,
      };
    })
    .filter(
      (result) =>
        result &&
        (/current\s*,\s*active/i.test(result.status) ||
          /^AC$/i.test(result.status))
    ) as VetResult[];

  return results;
}
