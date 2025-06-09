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
    mode: isLicenseNumberSearch ? "2" : "3",
    search: isLicenseNumberSearch ? "LicNbr" : "Name",
    SID: "",
    brd: "",
    typ: "",
  });
  const formData = new URLSearchParams();
  if (isLicenseNumberSearch) {
    formData.append("sobi2Search", licenseNumber);
  } else {
    formData.append("sobi2Search", firstName + " " + lastName);
  }
  formData.append("searchphrase", "any");
  formData.append("option", "com_sobi2");
  formData.append("sobi2Task", "axSearch");
  // ...append all other required fields as in your previous logic...

  // Call your Next.js API route (which proxies to the real DBPR site)
  console.log("Outgoing query params:", queryParams.toString());
  console.log("Outgoing form data:", formData.toString());

  const res = await fetch(`/api/verify/newmexico/?${queryParams.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });
  console.log("API response status:", res);
  if (!res.ok) throw new Error("Failed to fetch");
  const html = await res.text();

  // --- Parsing logic (as in your page.tsx) ---
  const rows = (html.match(/<tr[\s\S]*?<\/tr>/gi) || []).filter((row) => {
    // Find the fifth <td> in the row
    const tdMatches = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (tdMatches.length < 7) return false;

    // Extract and clean the status cell
    const statusCell = tdMatches[2][1]
      .replace(/<span\s*\/?>/gi, ",")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    // // Extract and clean the license type cell
    // const licenseTypeCell = tdMatches[0][1]
    //   .split(/<br\s*\/?>/i)[0] // Take only the part before <br>
    //   .replace(/<[^>]+>/g, "") // Remove any remaining HTML tags
    //   .replace(/\s+/g, " ") // Normalize whitespace
    //   .trim();
    // Only keep rows where status contains "Current, Active" (case-insensitive)
    return /current\s*,\s*active/i.test(statusCell);
  });
  console.log("HTML response snippet:", html.slice(0, 1000));

  const results: VetResult[] = rows
    .map((row) => {
      const tdMatches = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
      if (tdMatches.length < 5) return null;
      const nameTd = tdMatches[1][1];
      const nameMatch = nameTd.match(/<a[^>]*>([^<]+)<\/a>/i);
      const name = nameMatch
        ? nameMatch[1].trim()
        : nameTd.replace(/<[^>]+>/g, "").trim();

      // // Extract and clean the license number cell
      const licenseNumberCell = tdMatches[3][1]
        .split(/<br\s*\/?>/i)[0] // Take only the part before <br>
        .replace(/<[^>]+>/g, "") // Remove any remaining HTML tags
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

      // Extract and clean the status cell
      const statusExpRaw = tdMatches[4][1]
        .replace(/<br\s*\/?>/gi, ",")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      let status = "";
      let expiration = "";

      if (/current/i.test(statusExpRaw) && /active/i.test(statusExpRaw)) {
        status = "Current, Active";
        const dateMatch = statusExpRaw.match(/Active,\s*([0-9/]+)/i);
        expiration = dateMatch ? dateMatch[1].trim() : "";
      } else {
        const parts = statusExpRaw.split(",");
        status = parts[0] ? parts[0].trim() : "";
        expiration = parts[1] ? parts[1].trim() : "";
      }
      if (!name || !expiration) return null;
      return {
        name,
        licenseNumber: licenseNumberCell,
        status,
        expiration,
        licenseType: "",
      };
    })
    .filter(Boolean) as VetResult[];
  return results;
}
