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

  // Get all <tr> rows inside the inner table
  const rows = [...innerTable.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];

  // The first row is the header, so skip it
  const dataRows = rows.slice(1);

  const results: VetResult[] = dataRows
    .map((rowMatch) => {
      const row = rowMatch[1];
      const tdMatches = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
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
    .filter(Boolean) as VetResult[];

  return results;
}
