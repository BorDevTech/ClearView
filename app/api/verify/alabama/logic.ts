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
  const queryParams = new URLSearchParams({
    license: licenseNumber || "",
    lastname: lastName || "",
    business: "",
    city: "",
    zipcode: "null",
  });

  const res = await fetch(`/api/verify/alabama?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.text();
  // Parse the HTML using DOMParser (Edge Runtime or browser)
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, "text/html");
  const rows = Array.from(doc.querySelectorAll("#myDataTable tbody tr"));

  // Filter for names containing " - DVM"
  const filteredRows = rows.filter((row) => {
    const cells = row.querySelectorAll("td");
    const name = cells[0]?.textContent?.trim() || "";
    return name.includes(" - DVM");
  });

  // Map each filtered row to a VetResult
  const results: VetResult[] = filteredRows.map((row) => {
    const cells = row.querySelectorAll("td");
    const name = cells[0]?.textContent?.trim() || "";
    const licenseNumber = cells[1]?.textContent?.trim() || "";
    const issuedDate = cells[2]?.textContent?.trim() || "";
    const expirationDate = cells[3]?.textContent?.trim() || "";
    const links = cells[4]?.querySelectorAll("a") || [];
    const detailsUrl = links[0]?.getAttribute("href") || "";
    const reportUrl = links[1]?.getAttribute("href") || "";

    return {
      name,
      licenseNumber,
      issuedDate,
      expirationDate,
      detailsUrl,
      reportUrl,
      status: "active",
      expiration: expirationDate,
    } as VetResult;
  });

  return results;
}
