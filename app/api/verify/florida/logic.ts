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
  console.log("Florida Loaded");
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
  formData.append("hSID", "");
  if (isLicenseNumberSearch) {
    formData.append("hSearchType", "LicNbr");
    formData.append("LicNbr", licenseNumber);
    formData.append("Search1", "Search");
  } else {
    formData.append("hSearchType", "Name");
    formData.append("hLastName", lastName);
    formData.append("hFirstName", firstName);
  }
  // ...append all other required fields as in your previous logic...
  formData.append("hCurrPage", "1");
  formData.append("hTotalPages", "");
  formData.append("hDivision", "ALL");
  // formData.append("hBoard", "210");
  formData.append("LicenseType", "2601");
  formData.append("hBoard", "26");
  formData.append("hRecsPerPage", "10000");

  // Call your Next.js API route (which proxies to the real DBPR site)
  const res = await fetch(`/api/verify/florida/?${queryParams.toString()}`, {
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
    if (tdMatches.length < 5) return false;

    // Extract and clean the status cell
    const statusCell = tdMatches[4][1]
      .replace(/<br\s*\/?>/gi, ",")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    // Only keep rows where status contains "Current, Active" (case-insensitive)
    return /current\s*,\s*active/i.test(statusCell);
  });

  const results: VetResult[] = rows
    .map((row) => {
      const tdMatches = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
      if (tdMatches.length < 5) return null;
      const nameTd = tdMatches[1][1];
      const nameMatch = nameTd.match(/<a[^>]*>([^<]+)<\/a>/i);
      const name = nameMatch
        ? nameMatch[1].trim()
        : nameTd.replace(/<[^>]+>/g, "").trim();

      // // Extract and clean the license type cell
      const licenseTypeCell = tdMatches[0][1]
        .split(/<br\s*\/?>/i)[0] // Take only the part before <br>
        .replace(/<[^>]+>/g, "") // Remove any remaining HTML tags
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();
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
        licenseNumber: isLicenseNumberSearch
          ? licenseNumber
          : licenseNumberCell,
        status,
        expiration,
        licenseType: licenseTypeCell,
      };
    })
    .filter(Boolean) as VetResult[];
  return results;
}
