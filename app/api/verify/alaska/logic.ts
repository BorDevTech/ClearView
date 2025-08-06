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
  console.log("Alaska Loaded");

  const res = await fetch("/api/verify/alaska", {
    method: "GET",
  });

  if (!res.ok) throw new Error("Failed to fetch Alaska data");
  const rawData = await res.json();

  if (!Array.isArray(rawData)) {
    throw new Error("Alaska API response is not an array");
  }

  const filtered = rawData.filter((entry: any) => {
    const isVet = entry.Program?.trim() === "Veterinary" && entry.ProfType?.trim() === "Veterinarian";

    if (!isVet) return false;

    const matchesLicense = licenseNumber
      ? entry.LicenseNum?.toLowerCase().includes(licenseNumber.toLowerCase())
      : true;

    const matchesName = firstName || lastName
      ? (entry.DBA || entry.Owners || "")
          .toLowerCase()
          .includes(`${firstName} ${lastName}`.trim().toLowerCase())
      : true;

    return matchesLicense && matchesName;
  });

  const results: VetResult[] = filtered.map((entry: any) => ({
    name: typeof entry.DBA === "string"
      ? entry.DBA
      : typeof entry.Owners === "string"
      ? entry.Owners
      : "Unknown",
    licenseNumber: typeof entry.LicenseNum === "string"
      ? entry.LicenseNum.trim()
      : "",
    status: typeof entry.Status === "string"
      ? entry.Status.trim()
      : "",
    expiration: entry.DateExpired
      ? entry.DateExpired.toString()
      : "",
    // Optional properties can be added if needed
    // zip: entry.ZIP ? Number(entry.ZIP) : undefined,
    // licenseType: entry.ProfType?.trim(),
  }));

  return results;
}
