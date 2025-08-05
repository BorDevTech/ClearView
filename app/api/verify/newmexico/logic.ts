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
  console.log("API response status:", res.status, res.statusText);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();

  if (!data || !Array.isArray(data.Data)) {
    throw new Error("Invalid response format: missing Data array");
  }

  type VetDataItem = {
    Name?: string;
    LicenseNumber?: string;
    Status?: string;
    Expiration?: string;
    LicenseTypeName?: string;
    // Removed index signature for better type safety
  };

  const filtered = data.Data.filter(
    (item: VetDataItem) => item.LicenseTypeName === "Doctor of Veterinary Medicine"
  );

  return filtered.map((Vet: VetDataItem) => ({
    name: Vet.Name || "",
    licenseNumber: Vet.LicenseNumber || "",
    status: Vet.Status || "",
    expiration: Vet.Expiration || "",
    licenseType: Vet.LicenseTypeName || "",
  })); // This will be the raw JSON result
}
