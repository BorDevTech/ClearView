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
  const body = {
    action: "OH_VerifyLicenseCtlr",
    type: "rpc",
    tid: 2,
    method: "findLicensesForOwner",
    data: [
      {
        board: "Veterinary Medicine",
        firstName: firstName || "",
        lastName: lastName || "",
        licenseNumber: licenseNumber || "",
        licenseType: "",
        searchType: "individual",
        state: "none",
      },
    ],
    ctx: {
      authorization:
        "eyJub25jZSI6InM1UV8yZUY4VlVGLWJrZ1RWbjRqMzU4U2xpcFRKYkl5OWVkN3ZnWmhBUlVcdTAwM2QiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImtpZCI6IntcInRcIjpcIjAwREMwMDAwMDAxNmtoT1wiLFwidlwiOlwiMDJHQzAwMDAwMDBYdGRCXCIsXCJhXCI6XCJ2ZnJlbW90aW5nc2lnbmluZ2tleVwiLFwidVwiOlwiMDA1dDAwMDAwMDRDZHEzXCJ9IiwiY3JpdCI6WyJpYXQiXSwiaWF0IjoxNzUwNTEwMTQ3OTk3LCJleHAiOjB9.Q2lsUFNGOVdaWEpwWm5sTWFXTmxibk5sUTNSc2NpNW1hVzVrVEdsalpXNXpaWE5HYjNKUGQyNWxjZz09.DiPKCzpjxFq1hnEO9s4nBBByB7vB9Cf0nAR0AGQwMwE=",
      csrf: "VmpFPSxNakF5TlMwd05pMHlORlF3TURvek9EbzFNaTQwT0RWYSw0OUhnR1pTMlJOajBSV1ZjM2wtaGRxS1pxUEdPcUNKNmlwTzdfeks5ZGxZPSxaVFl4WXpsaw==",
      ns: "",
      ver: 46,
      vid: "066t0000000H0Ni",
    },
  };

  const res = await fetch("/api/verify/delaware", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Failed to fetch Delaware license data");

  const responseData = await res.json();

  interface DelawareVet {
    Status?: string;
    Name?: string;
    RecNumber?: string;
    // ...other fields as needed
  }

  const allRecords: DelawareVet[] = responseData[0]?.result?.v || [];
  allRecords.forEach((item) => console.log(item.Status));
  const records = allRecords.filter(
    (item) => (item.Status || "").trim().toLowerCase() === "active"
  );

  // Note: issuedDate, expirationDate, and expiration are not present in the Delaware response.
  const results = records.map((item) => ({
    name: item.Name || "",
    licenseNumber: item.RecNumber || "",
    issuedDate: null, // Not present in response, fill if available
    expirationDate: null, // Not present in response, fill if available
    status: item.Status || "",
    detailsUrl: null,
    reportUrl: null,
    expiration: "", // Not present in response, using empty string instead of null
  }));

  await BlobSync("delaware", results);
  return results;
}
