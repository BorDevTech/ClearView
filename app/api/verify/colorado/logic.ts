import { VetResult } from "@/app/types/vet-result";

interface VetRecord {
  last_name: string;
  first_name: string;
  middle_name: string;
  suffix: string;
  license_number: string;
  license_expiration_date: string;
  license_status_description: string;
  title: string;
  formatted_name: string;
}

function buildFullName(record: VetRecord): string {
  const parts = [
    record.last_name?.trim(),
    record.first_name?.trim(),
    record.middle_name?.trim(),
    record.suffix?.trim(),
    record.license_number?.trim(),
    record.license_expiration_date?.trim(),
    record.license_status_description?.trim(),
    record.title?.trim(),
    record.formatted_name?.trim(),
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

  const res = await fetch(`/api/verify/missouri?${queryParams.toString()}`);
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
    name: buildFullName(record),
    licenseNumber: record.license_number,
    expirationDate: record.license_expiration_date,
    status: record.license_status_description || "",
    expiration: record.license_expiration_date,
  }));
}
