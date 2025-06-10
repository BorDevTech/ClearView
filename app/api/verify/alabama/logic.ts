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
  // ...Alabama-specific fetch and parsing logic here...
  console.log("Alabama Loaded");
  const res = await fetch(`/api/verify/alabama/? `, {
    method: "GET",
    headers: {},
  });
  console.log("API response status:", res);
  if (!res.ok) throw new Error("Failed to fetch");
  const html = await res.text();
  return [];
}
