import { NextRequest, NextResponse } from "next/server";
import BlobFetch from "@/data/controls/blobs/blobFetch";
import BlobCheck from "@/data/controls/blobs/blobCheck";
// import BlobCreate from "@/data/controls/blobs/blobCreate";
import BlobUpdate from "@/data/controls/blobs/blobUpdate";
// import BlobSync from "@/data/controls/blobs/blobSync";
import BlobConvert from "@/data/controls/blobs/BlobConvert";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

/**
   * ORIGINAL FETCH BY CSV
   *  @link https://www.commerce.alaska.gov/cbp/main/
   *  or direct download link:
   *  @link https://www.commerce.alaska.gov/cbp/main/DbDownload/ProfessionalLicenseDownload
   */

export async function GET(request: NextRequest) {

  const { search } = new URL(request.url);
  console.log("Search params:", search);
  console.log("Starting Alaska verification process...");
  const key = "alaska";

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




  /// Most recent: Compare GitHub vs Local, update if GitHub is newer
  // try {
  //   const filePath = path.resolve(`./data/${key}Vets.json`);
  //   const local = await readFile(filePath, "utf-8");
  //   const data = JSON.parse(local);
  //   return NextResponse.json({
  //     timestamp: data?.timestamp,
  //     state: key,
  //     count: data?.count,
  //     blob: data?.results,
  //   });
  // } catch (error) {
  //   return NextResponse.json({
  //     ok: false,
  //     error: `Failed to read local ${key} data` + (error as Error).message,
  //     status: 500,
  //   });
  // }

  ///Day 1: Original fetch by CSV

  // const { search } = new URL(request.url);
  // const url =
  //   "https://raw.githubusercontent.com/BorDevTech/ClearView/refs/heads/main/data/alaskaVets.json" +
  //   (search || "");

  // try {
  //   const data = await BlobFetch(key);
  //   // ✅ Convert and write blob immediately after fetch
  //   await BlobConvert(key, data);

  //   return NextResponse.json({
  //     blob: data,
  //     count: Array.isArray(data) ? data.length : 0,
  //   });
  // } catch (error: unknown) {
  //   // // // 🌐 Fallback: fetch HTML and parse
  //   // const { verify } = await import(`./../../../app/api/verify/${key}/logic`);
  //   // // Forward all query string parameters from the incoming request
  //   // const { search } = new URL(request.url);
  //   // const results = await verify(search); // 👈 verify now parses HTML directly
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
  //   } catch (fallbackError) {
  //     return NextResponse.json({
  //       ok: false,
  //       error: fallbackError instanceof Error ? fallbackError.message : `Failed to fetch ${key} data`,
  //       status: 500,
  //     });
  //   };
  // }
}