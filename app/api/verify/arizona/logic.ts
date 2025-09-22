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
  console.log("Arizona Loaded");

  const keyword = [licenseNumber, firstName, lastName].filter(Boolean).join(" ").trim();

  const queryParams = new URLSearchParams({
    keyword,
    skip: "0",
    take: "20000",
    lang: "en-us",
    licenseType: "Veterinarian (Regular)",
    licenseStatus: "Active",
    disciplined: "false",
  }); type ArizonaEntry = {
    columnValues: { data: string }[];
  };


  const res = await fetch(`/api/verify/arizona/?${queryParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch Arizona data");

  const data = await res.json();
  const rawResults = data?.result?.dataResults || [];

  const results: VetResult[] = rawResults.map((entry: ArizonaEntry) => {
    const licenseNumber = entry.columnValues?.[0]?.data || "";
    const first = entry.columnValues?.[1]?.data || "";
    const last = entry.columnValues?.[2]?.data || "";
    const name = `${first} ${last}`.trim();

    return {
      name,
      licenseNumber,
      issuedDate: "",
      expirationDate: "",
      detailsUrl: "",
      reportUrl: "",
      status: "active",
      expiration: "",
    };
  });

  await BlobSync("arizona", results);
  return results;
}


