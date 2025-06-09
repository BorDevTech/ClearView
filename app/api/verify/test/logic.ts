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
  console.log("Test Loaded");
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
  formData.append("hSearchType", isLicenseNumberSearch ? "LicNbr" : "Name");
  formData.append("hLastName", lastName);
  formData.append("hFirstName", firstName);
  // ...append all other required fields as in your previous logic...
  formData.append("hDivision", "ALL");
  formData.append("hBoard", "210");
  formData.append("LicenseType", "2601");
  formData.append("Board", "26");
  formData.append("LicNbr", licenseNumber);
  formData.append("Search1", "Search");
  formData.append("hRecsPerPage", "10000");
  formData.append("RecsPerPage", "10000");

  // Call your Next.js API route (which proxies to the real DBPR site)
  const res = await fetch(`/api/verify/test/?${queryParams.toString()}`, {
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
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const results: VetResult[] = rows
    .map((row) => {
      const tdMatches = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
      if (tdMatches.length < 5) return null;
      const nameTd = tdMatches[1][1];
      const nameMatch = nameTd.match(/<a[^>]*>([^<]+)<\/a>/i);
      const name = nameMatch
        ? nameMatch[1].trim()
        : nameTd.replace(/<[^>]+>/g, "").trim();
      const statusExp = tdMatches[4][1].replace(/<[^>]+>/g, "").trim();
      let status = "";
      let expiration = "";
      if (/current/i.test(statusExp) && /active/i.test(statusExp)) {
        status = "Current, Active";
        const dateMatch = statusExp.match(/Active,\s*([0-9/]+)/i);
        expiration = dateMatch ? dateMatch[1].trim() : "";
      } else {
        const parts = statusExp.split(",");
        status = parts[0] ? parts[0].trim() : "";
        expiration = parts[1] ? parts[1].trim() : "";
      }
      if (!name || !expiration) return null;
      return {
        name,
        licenseNumber, // Add logic if needed
        status,
        expiration,
        licenseType: "", // Add logic if needed
      };
    })
    .filter(Boolean) as VetResult[];
  return results;
}
