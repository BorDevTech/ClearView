import { VetResult } from "@/app/types/vet-result";

interface VetRecord {
  prc_first_name: string;
  prc_middle_name: string;
  prc_last_name: string;
  prc_suffix: string;
  lic_number: string;
  lst_description: string;
  les_description: string;
  prc_dba_name: string;
  lic_orig_issue_date: string;
  lic_exp_date: string;
  prc_entity_name: string;
}

function buildFullName(record: VetRecord): string {
  const parts = [
    record.prc_first_name?.trim(),
    record.prc_middle_name?.trim(),
    record.prc_last_name?.trim(),
    record.prc_suffix?.trim(),
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
      record.lic_number.toLowerCase() !== licenseNumberLower
    ) {
      return false;
    }
    if (
      lastName &&
      !record.prc_last_name.toLowerCase().includes(lastNameLower)
    ) {
      return false;
    }
    if (
      firstName &&
      !record.prc_first_name.toLowerCase().includes(firstNameLower)
    ) {
      return false;
    }
    return true;
  });

  return filtered.map((record) => ({
    name: buildFullName(record),
    licenseNumber: record.lic_number,
    issuedDate: record.lic_orig_issue_date,
    expirationDate: record.lic_exp_date,
    status: record.lst_description || "",
    detailsUrl: "",
    reportUrl: "",
    expiration: record.lic_exp_date,
  }));
}
