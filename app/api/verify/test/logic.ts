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
  const url = "https://raw.githubusercontent.com/BorDevTech/ClearView/main/package.json";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch package.json from GitHub");
  const data = await res.json();
  // For demonstration, return the package name as a mock VetResult
  return [
    {
      name: data.scripts.dev || "No Name",
      licenseNumber: "",
      status: "",
      expiration: "",
      licenseType: "",
    },
  ];
}
