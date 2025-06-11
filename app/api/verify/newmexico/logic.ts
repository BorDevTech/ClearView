import { VetResult } from "@/app/types/vet-result";

interface NMVetRecord {
  licenseTypeName: string;
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
  //
  console.log("New Mexico Loaded");
  //filter recieved input to determine search type
  // const isLicenseNumberSearch = licenseNumber && licenseNumber.trim() !== "";

  // // Build query params and form data
  const queryParams = new URLSearchParams({
    EntityType: "I",
    FirstName: firstName,
    LastName: lastName,
    DBAName: "",
    LicenseNumber: licenseNumber,
    SortDirection: "ASC",
    PageSize: "10000",
    SortColumn: "Default",
    firstRecord: "0",
    PageNumber: "0",
    IsPagedData: "1",
  });

  // ...append all other required fields as in your previous logic...

  // Call your Next.js API route (which proxies to the real DBPR site)
  // console.log("Outgoing query params:", queryParams.toString());

  const res = await fetch(
    `/api/verify/newmexico/?${queryParams.toString()}`
  );
  console.log("API response status:", res);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();

  const filtered = data.Data.filter(
    (item: any) => item.LicenseTypeName === "Doctor of Veterinary Medicine"
  );

  return filtered.map((Vet: any) => ({
    name: Vet.Name,
    licenseNumber: Vet.LicenseNumber,
    status: "",
    expiration: "",
    licenseType: "",
  })); // This will be the raw JSON result
}
