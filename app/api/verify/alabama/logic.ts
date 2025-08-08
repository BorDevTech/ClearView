
import { VetResult } from "@/app/types/vet-result";
import BlobSync from "@/data/controls/blobs/blobSync";

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
    firstName: firstName || "",
    lastName: lastName || "",
    business: "",
    city: "",
    zipcode: "null",
  });



  const html = await fetchHTML(queryParams);
  const results = parseHTML(html);
  return results;

  // 🔹 Internal fetcher
  async function fetchHTML(params: URLSearchParams): Promise<string> {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/verify/alabama?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch");
    return await res.text();
  }

  // 🔹 Internal parser
  function parseHTML(html: string): VetResult[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const rows = Array.from(doc.querySelectorAll("#myDataTable tbody tr"));

    return rows
      .filter((row) => {
        const name = row.querySelector("td")?.textContent?.trim() || "";
        return name.includes(" - DVM");
      })
      .map((row) => {
        const cells = row.querySelectorAll("td");
        return {
          name: cells[0]?.textContent?.trim() || "",
          licenseNumber: cells[1]?.textContent?.trim() || "",
          issuedDate: cells[2]?.textContent?.trim() || "",
          expirationDate: cells[3]?.textContent?.trim() || "",
          detailsUrl: cells[4]?.querySelector("a")?.getAttribute("href") || "",
          reportUrl: cells[4]?.querySelectorAll("a")[1]?.getAttribute("href") || "",
          status: "active",
          expiration: cells[3]?.textContent?.trim() || "",
        } as VetResult;
      });
  }


  // // 💾 Save to JSON locally
  // const outputPath = path.join(process.cwd(), "data", "alabamaVets.json");
  // fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  // console.log(`✅ Saved ${results.length} Alabama vet records to ${outputPath}`);


  return results;
}
