import { VetResult } from "@/app/types/vet-result";

export async function verify(
  firstName: string,
  lastName: string,
  licenseNumber: string
): Promise<VetResult[]> {
  // ...Alaska-specific fetch and parsing logic here...
  return [];
}
