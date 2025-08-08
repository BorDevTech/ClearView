import { VetResult } from "@/app/types/vet-result";
import BlobSync from "@/data/controls/blobs/blobSync";

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
    license: licenseNumber || "",
    lastname: lastName || "",
    business: "",
    city: "",
    zipcode: "null",
  });

  const res = await fetch(`/api/verify/arkansas?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();

  // Define a type for Arkansas license items
  type ArkansasLicenseItem = {
    licensee: string;
    lastName?: string;
    licenseNumber: string;
    status?: string;
    lType?: string;
  };

  // Filter for DVMs and search params
  const filtered = (data.data || []).filter((item: ArkansasLicenseItem) => {
    if (!item) return false;
    const plainName = item.licensee?.replace(/<[^>]+>/g, "") || "";
    const isDVM = /DVM/i.test(plainName);
    const matchesFirst = firstName
      ? plainName.toLowerCase().includes(firstName.toLowerCase())
      : true;
    const matchesLast = lastName
      ? item.lastName?.toLowerCase().includes(lastName.toLowerCase())
      : true;
    const matchesLicense = licenseNumber
      ? item.licenseNumber === licenseNumber
      : true;
    return isDVM && matchesFirst && matchesLast && matchesLicense;
  });

  // Fetch expiration date for each license in parallel
  const results = await Promise.all(
    filtered.map(async (item: ArkansasLicenseItem) => {
      let expiration = "";
      try {
        const detailRes = await fetch(
          `https://mip.agri.arkansas.gov/VetLicensingPortal/Guest/Home/Get_Licensee_Info?id=${item.licenseNumber}`
        );
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          expiration =
            detailData?.data?.[0]?.lexpdate ||
            detailData?.data?.[0]?.real_exp_date ||
            "";
        }
      } catch {
        // Ignore errors, leave expiration blank
      }
      // Clean name: remove HTML and " DVM..." suffix
      let name = item.licensee.replace(/<[^>]+>/g, "");
      name = name.replace(/\s+DVM.*/i, "").trim();
      return {
        name,
        licenseNumber: item.licenseNumber,
        status: item.status,
        expiration,
        licenseType: item.lType,
      } as VetResult;
    })
  );

  await BlobSync("arkansas", results);
  return results;
}
