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

  type RawVetEntry = {
    prc_first_name: string;
    prc_middle_name: string;
    prc_last_name: string;
    prc_suffix: string;
    lic_profession: string;
    lic_number: string;
    lst_description: string;
    les_description: string;
    prc_dba_name: string;
    lic_orig_issue_date: string;
    lic_exp_date: string;
    prc_entity_name: string;
  };
  const key = "missouri";

  // 🔍 Internal helper: parse blob response
  function parseBlob(raw: RawVetEntry[] | { blob?: RawVetEntry[] }): RawVetEntry[] {
    return Array.isArray(raw) ? raw : raw.blob ?? [];
  }

  // 🧠 Internal helper: filter and transform entries
  function filterEntries(entries: RawVetEntry[]): VetResult[] {
    // 🧹 Normalize and map entries
    return entries
      .filter((entry) => {
        const isVet = entry.lic_profession?.trim() === "VET" && entry.lst_description?.trim() === "Active";
        if (!isVet) return false;

        const matchesLicense = licenseNumber
          ? entry.lic_number?.toLowerCase().includes(licenseNumber.toLowerCase())
          : true;

        let matchesName = true;
        if (firstName) {
          matchesName =
            typeof entry.prc_first_name === "string" &&
            entry.prc_first_name.toLowerCase().startsWith(firstName.toLowerCase());
        }
        if (matchesName && lastName) {
          matchesName =
            typeof entry.prc_last_name === "string" &&
            entry.prc_last_name.toLowerCase().startsWith(lastName.toLowerCase());
        }

        return matchesLicense && matchesName;

      })
      .map((entry) => ({
        name: `${entry.prc_first_name} ${entry.prc_last_name}`.trim(),
        licenseNumber: entry.lic_number?.trim(),
        status: entry.lst_description?.trim(),
        issued: new Date(entry.lic_orig_issue_date).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }),
        expiration: new Date(entry.lic_exp_date).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
      }));
  }


  const res = await fetch(`/api/verify/${key}`, {
    method: "GET",
  });

  if (!res.ok) throw new Error(`Failed to fetch ${key} data`);
  const rawData = await res.json();
  const parsedData = parseBlob(rawData);
  const results = filterEntries(parsedData);
  return results;
} 