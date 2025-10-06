import BlobCheck from "@/data/controls/blobs/blobCheck";
import BlobCreate from "@/data/controls/blobs/blobCreate";
import BlobUpdate from "@/data/controls/blobs/blobUpdate";

import BlobConvert from "@/data/controls/blobs/BlobConvert";

import BlobFetch from "@/data/controls/blobs/blobFetch";

import { NextResponse, type NextRequest } from "next/server";


import { readFile, writeFile } from "fs/promises";
import path from "path";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { search } = new URL(request.url);
  const key = "newmexico";

  const source = await fetch(`https://raw.githubusercontent.com/BorDevTech/ClearView/refs/heads/main/data/${key}Vets.json`);
  const latestData = await source.json();
  const latestTimestamp = new Date(latestData?.timestamp).getTime();
  console.log("Latest timestamp from GitHub:", latestTimestamp);
  // Fetch existing blob data
  const filePath = path.resolve(`./data/${key}Vets.json`);
  const local = await readFile(filePath, "utf-8");
  const localData = JSON.parse(local);
  const localTimestamp = new Date(localData?.timestamp).getTime();
  console.log("Local timestamp from file:", localTimestamp);

  try {
    if (latestTimestamp > localTimestamp) {
      console.log("GitHub data is newer than local data. Attempting to update...");
      const pingRegion = await BlobCheck(key);
      console.log(`Ping to ${key} source:`, pingRegion ? "reachable" : "unreachable");
      const results = await BlobFetch(key);
      console.log("Fetched latest blob data, updating local file...");

      // Overwrite the local file with the latest GitHub data
      await writeFile(filePath, JSON.stringify(results, null, 2), "utf-8");
      // Read back the file to confirm
      const newLocal = await readFile(filePath, "utf-8");
      const newLocalData = JSON.parse(newLocal);
      console.log("✅ Local file updated with latest GitHub data");
      return NextResponse.json(
        {
          timestamp: newLocalData?.timestamp,
          state: key,
          count: newLocalData?.count,
          results: newLocalData?.results,
        }
      );

    }
  } catch (error: unknown) {
    console.log("Error during update process:", error);
    return NextResponse.json({
      timestamp: localData?.timestamp,
      state: key,
      count: localData?.count ?? localData?.results?.length,
      results: localData?.results ?? localData,
    });
  }
  return NextResponse.json({
    timestamp: localData?.timestamp,
    state: key,
    count: localData?.count ?? localData?.results?.length,
    results: localData?.results ?? localData,
  });
}

// Forward all query string parameters from the incoming request
// const url =
//   "https://ws.bvm.nm.gov/api/public/DataAccess/publicLicenseSearch/Public/" +
//   (search || "");

// try {
//   const response = await fetch(url, {
//     method: "GET",
//     headers: {
//       "User-Agent":
//         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
//       Referer: "https://online.bvm.nm.gov",
//       Origin: "https://online.bvm.nm.gov",
//       Accept: "application/json",
//     },
//   });
//   if (!response.ok) {
//     throw new Error(`Failed with status: ${response.status} ${response.statusText}`);
//   }

//   const results = await response.json();
//   const existingBlob = await BlobCheck(key);
//   console.log("Existing Blob:", existingBlob);
//   if (!existingBlob) {
//     const filteredResults = results?.Data.filter((item: { LicenseTypeName: string }) => item.LicenseTypeName.includes("Doctor of Veterinary Medicine"));
//     const filterCount = filteredResults.length;
//     console.log(`Filtered Count: ${filterCount}`);



//     await BlobCreate(key);
//     const payload = {
//       timestamp: new Date().toISOString(),
//       region: key,
//       count: filterCount,
//       results: filteredResults,
//     };

//     await BlobUpdate(key, payload)
//   }
//   console.log(results?.Data.filter((x: { LicenseNumber: string }) => x.LicenseNumber.startsWith("DVM-")).slice(0, 5).map((x: { LicenseNumber: string }) => x.LicenseNumber));

//   return Response.json(results, {
//     status: 200,
//   });
// } catch (error) {
//   return Response.json(
//     {
//       error: error instanceof Error ? error.message : "Failed to fetch data",
//     },
//     { status: 500 }
//   );
// }




// If GitHub is newer, update local and blob V1
// if (latestTimestamp > localTimestamp || isNaN(localData?.timestamp)) {
//   console.log("GitHub data is newer than local data. Attempting to update...");
//   try {
//     // If GitHub is newer, check if source is reachable
//     const pingRegion = await BlobCheck(key);
//     console.log(`Ping to ${key} source:`, pingRegion ? "reachable" : "unreachable");
//     let currentData = latestData;
//     // If reachable, fetch and update local
//     if (pingRegion) {
//       console.log("Source reachable, fetching latest blob data...");
//       await BlobUpdate(key, currentData);
//       const pulsedData = await BlobFetch(key);
//       console.log("Fetched latest blob data, updating local file...");
//       await BlobConvert(key, pulsedData);
//       console.log("Local file updated with latest blob data.");
//       currentData = pulsedData;
//       console.log("Current data set to latest blob data.");

//     } else {
//       console.log("Source unreachable, using GitHub data to update local file...");
//       await BlobConvert(key, latestData);
//       console.log("Local file updated with GitHub data.");
//     }

//     return NextResponse.json({
//       timestamp: currentData?.timestamp,
//       state: key,
//       count: currentData?.count,
//       results: currentData?.results,
//     });
//   }
//   catch (error: unknown) {
//     console.log("Error during update process:", error);
//     // else: GitHub not newer, serve local
//     return NextResponse.json({
//       timestamp: localData?.timestamp,
//       state: key,
//       count: localData?.count ?? localData?.results?.length,
//       results: localData?.results ?? localData,
//     });
//   }
// }