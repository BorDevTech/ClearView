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

  const allRecords = responseData[0]?.result?.v || [];
  interface DelawareLicenseRecord {
    Status: string;
    Name: string;
    RecNumber: string;
  }

    allRecords.forEach((item: DelawareLicenseRecord) => console.log(item.Status));
  const records: DelawareLicenseRecord[] = allRecords.filter(
    (item: DelawareLicenseRecord) => (item.Status || "").trim().toLowerCase() === "active"
  );

  return records.map((item) => ({
    name: item.Name || "",
    licenseNumber: item.RecNumber || "",
    issuedDate: "", // Not present in response, fill if available
    expirationDate: "", // Not present in response, fill if available
    status: item.Status || "",
    detailsUrl: "",
    reportUrl: "",
    expiration: "", // Not present in response, fill if available
  }));
}
