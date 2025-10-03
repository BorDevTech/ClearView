import { NextResponse } from "next/server";

async function GET() {
    // Read the server-only env var
    const token = process.env.BLOB_READ_WRITE_TOKEN;



    // Never return the raw token to the client!


    //New Mexico Veterinary License Verification API
    // const key = "newmexico";
    // // Forward all query string parameters from the incoming request
    // const { search } = new URL(request.url);
    // const url =
    //     "https://ws.bvm.nm.gov/api/public/DataAccess/publicLicenseSearch/Public/" +
    //     (search || "");

    // try {
    //     const response = await fetch(url, {
    //         method: "GET",
    //         headers: {
    //             "User-Agent":
    //                 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    //             Referer: "https://online.bvm.nm.gov",
    //             Origin: "https://online.bvm.nm.gov",
    //             Accept: "application/json",
    //         },
    //     });
    //     if (!response.ok) {
    //         throw new Error(`Failed with status: ${response.status} ${response.statusText}`);
    //     }

    //     const results = await response.json();
    //     const existingBlob = await BlobCheck(key);
    //     console.log("Existing Blob:", existingBlob);
    //     if (!existingBlob) {
    //         const filteredResults = results?.Data.filter((item: { LicenseTypeName: string }) => item.LicenseTypeName.includes("Doctor of Veterinary Medicine"));
    //         const filterCount = filteredResults.length;
    //         console.log(`Filtered Count: ${filterCount}`);



    //         await BlobCreate(key);
    //         const payload = {
    //             timestamp: new Date().toISOString(),
    //             region: key,
    //             count: filterCount,
    //             results: filteredResults,
    //         };

    //         await BlobUpdate(key, payload)
    //     }



    // Instead, return a boolean or masked version
    return NextResponse.json({
        ok: !!token,
        preview: token ? token : null,
    });
}