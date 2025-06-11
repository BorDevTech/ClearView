import { VetResult } from "@/app/types/vet-result";

// Minimal test logic that fetches a public file from GitHub
export async function verify({
  firstName,
  lastName,
  licenseNumber,
}: {
  firstName: string;
  lastName: string;
  licenseNumber: string;
}): Promise<VetResult[]> {
  // Use the raw.githubusercontent.com URL to fetch the actual file content
  const url =
    "https://mydatcp.wi.gov/documents/dah/VEBRegistries_VeterinarianLicense.pdf";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch package.json from GitHub");
  // Get the PDF as an ArrayBuffer (binary data)
  const pdfBuffer = await res.arrayBuffer();

  // For demonstration, just return the size of the PDF as the "name"
  return [
    {
      name: `PDF size: ${pdfBuffer.byteLength} bytes`,
      licenseNumber: "",
      status: "",
      expiration: "",
      licenseType: "",
    },
  ];
}
