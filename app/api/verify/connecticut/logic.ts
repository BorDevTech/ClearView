import { VetResult } from "@/app/types/vet-result";

interface VetRecord {
  last_name: string;
  first_name: string;
  middle_name: string;
  license_number: string;
  license_expiration_date: string;
  license_status_description: string;
  formatted_name: string;
}

function buildFullName(record: VetRecord): string {
  const parts = [
    record.first_name?.trim(),
    record.middle_name?.trim(),
    record.last_name?.trim(),
  ].filter(Boolean);
  return parts.join(" ");
}

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
    firstname: firstName || "",
    license: licenseNumber || "",
    lastname: lastName || "",
  });

  const res = await fetch(`/api/verify/connecticut?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch VET.json from GitHub");

  const data: VetRecord[] = await res.json();

  const firstNameLower = firstName.toLowerCase();
  const lastNameLower = lastName.toLowerCase();
  const licenseNumberLower = licenseNumber.toLowerCase();

  const filtered = data.filter((record) => {
    if (
      licenseNumber &&
      record.license_number.toLowerCase() !== licenseNumberLower
    ) {
      return false;
    }
    if (lastName && !record.last_name.toLowerCase().includes(lastNameLower)) {
      return false;
    }
    if (
      firstName &&
      !record.first_name.toLowerCase().includes(firstNameLower)
    ) {
      return false;
    }
    return true;
  });

  return filtered.map((record) => ({
    name: record.formatted_name?.trim() || buildFullName(record),
    status: record.license_status_description || "",
    expirationDate: record.license_expiration_date,
    licenseNumber: record.license_number,
    expiration: record.license_expiration_date,
  }));
}
