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
  
  type RawVetEntry = {
  Program: string;
  ProfType: string;
  LicenseNum: string;
  DBA: string;
  Owners: string;
  Status: string;
  DateIssued: string;
  DateEffective: string;
  DateExpired: string;
  ADDRESS1: string;
  ADDRESS2: string;
  CITY: string;
  STATE: string;
  ZIP: string;
};


  const res = await fetch("/api/verify/alaska", {
    method: "GET",
  });

  if (!res.ok) throw new Error("Failed to fetch Alaska data");
  const rawData = await res.json();

  const filtered = rawData.filter((entry: RawVetEntry) => {
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

  const results: VetResult[] = filtered.map((entry: RawVetEntry) => ({
    name: entry.DBA || entry.Owners || "Unknown",
    licenseNumber: entry.LicenseNum?.trim(),
    status: entry.Status?.trim(),
    issued: entry.DateIssued ? new Date(entry.DateIssued) : null,
    expires: entry.DateExpired ? new Date(entry.DateExpired) : null,
    location: `${entry.CITY}, ${entry.STATE} ${entry.ZIP}`.trim(),
  }));

  return results;
}
