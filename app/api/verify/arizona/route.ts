import BlobConvert from "@/data/controls/blobs/BlobConvert";
// import BlobCreate from "@/data/controls/blobs/blobCreate";
import BlobFetch from "@/data/controls/blobs/blobFetch";
// import BlobSync from "@/data/controls/blobs/blobSync";
import BlobUpdate from "@/data/controls/blobs/blobUpdate";
import { NextResponse, type NextRequest } from "next/server";


import { readFile } from "fs/promises";
import path from "path";
import BlobCheck from "@/data/controls/blobs/blobCheck";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {

  const { search } = new URL(request.url);
  console.log("Search params:", search);
  const key = "arizona";
  const source = await fetch(`https://raw.githubusercontent.com/BorDevTech/ClearView/refs/heads/main/data/${key}Vets.json`);
  const latestData = await source.json();
  const latestTimestamp = new Date(latestData?.timestamp).getTime();
  console.log("Latest timestamp from GitHub:", latestTimestamp);
  // Fetch existing blob data
  const filePath = path.resolve(`./data/${key}Vets.json`);
  const local = await readFile(filePath, "utf-8");
  const localData = JSON.parse(local);
  console.log("Local timestamp from file:", new Date(localData?.timestamp).getTime());

  if (latestTimestamp > new Date(localData?.timestamp).getTime()) {
    console.log("GitHub data is newer than local data. Attempting to update...");
    try {
      // If GitHub is newer, check if source is reachable
      const pingRegion = await BlobCheck(key);
      console.log(`Ping to ${key} source:`, pingRegion ? "reachable" : "unreachable");
      let currentData = latestData;
      // If reachable, fetch and update local
      if (pingRegion) {
        console.log("Source reachable, fetching latest blob data...");
        await BlobUpdate(key, currentData);
        const pulsedData = await BlobFetch(key);
        console.log("Fetched latest blob data, updating local file...");
        await BlobConvert(key, pulsedData);
        console.log("Local file updated with latest blob data.");
        currentData = pulsedData;
        console.log("Current data set to latest blob data.");

      } else {
        console.log("Source unreachable, using GitHub data to update local file...");
        await BlobConvert(key, latestData);
        console.log("Local file updated with GitHub data.");
      }

      return NextResponse.json({
        timestamp: currentData?.timestamp,
        state: key,
        count: currentData?.count,
        results: currentData?.results,
      });
    }
    catch (error: unknown) {
      console.log("Error during update process:", error);
      // else: GitHub not newer, serve local
      return NextResponse.json({
        timestamp: localData?.timestamp,
        state: key,
        count: localData?.count ?? localData?.results?.length,
        results: localData?.results ?? localData,
      });
    }
  }
  return NextResponse.json({
    timestamp: localData?.timestamp,
    state: key,
    count: localData?.count ?? localData?.results?.length,
    results: localData?.results ?? localData,
  });




  ////////CURRENTLY DISABLED BELOW - ENABLE WHEN READY//////

  // const { search } = new URL(request.url);
  // const url =
  //   "https://raw.githubusercontent.com/BorDevTech/ClearView/refs/heads/main/data/arizonaVets.json" +
  //   (search || "");

  // try {
  //   const blobData = await BlobFetch(key);
  //   // ✅ Convert and write blob immediately after fetch
  //   await BlobConvert(key, blobData);
  //   const response = await fetch(url, {
  //     method: "GET",
  //     headers: {
  //       "User-Agent": "Mozilla/5.0",
  //       Accept: "application/json",
  //     },
  //   });
  //   const data = await response.text();
  //   return new Response(data, {
  //     headers: { "Content-Type": "application/json; charset=utf-8" },
  //     status: response.status,
  //   });
  // } catch (error: unknown) {
  //   console.warn(`⚠️ BlobFetch failed for ${key}, falling back to live parse: ${error}`);
  //   // If blob does not exist, fetch and parse, then create/update blob
  //   ////
  //   try {
  //     const response = await fetch(url, {
  //       method: "GET",
  //       headers: {
  //         "User-Agent": "Mozilla/5.0",
  //         Accept: "application/json",
  //       },
  //     });
  //     const data = await response.text();
  //     const results = JSON.parse(data);
  //     await BlobCreate(key);
  //     await BlobUpdate(key, {
  //       timestamp: new Date().toISOString(),
  //       state: key,
  //       results
  //     });
  //     // Optionally, sync the blob after update
  //     const blob = await BlobSync(key, results);
  //     return NextResponse.json({ count: results.length, blob, results });
  //   }


  //   // catch (error: unknown) {
  //   //   // Forward all query string parameters from the incoming request
  //   //   const { search } = new URL(request.url);
  //   //   const url =

  //   //     "https://azsvmeb.portalus.thentiacloud.net/rest/public/profile/search/?" +
  //   //     (search || "");

  //   //   try {
  //   //     const response = await fetch(url, {
  //   //       method: "GET",
  //   //       headers: {
  //   //         "User-Agent":
  //   //           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  //   //         Referer: "https://azsvmeb.portalus.thentiacloud.net/webs/portal/register/",
  //   //         Origin: "https://azsvmeb.portalus.thentiacloud.net",
  //   //         Accept: "*/*",
  //   //       },
  //   //     });
  //   //     const data = await response.text();
  //   //     return new Response(data, {
  //   //       headers: { "Content-Type": "application/json; charset=utf-8" },
  //   //       status: response.status,
  //   //     });
  //   //   } catch (error: unknown) {
  //   //     return Response.json(
  //   //       {
  //   //         error: error instanceof Error ? error.message : "Failed to fetch data",
  //   //       },
  //   //       { status: 500 }
  //   //     );
  //   //   }
  //   // } 
  //   catch (fallbackError) {
  //     return NextResponse.json({
  //       ok: false,
  //       error: fallbackError instanceof Error ? fallbackError.message : `Failed to fetch ${key} data`,
  //       status: 500,
  //     });
  //   };
  // }
}
