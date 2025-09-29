import { NextRequest, NextResponse } from "next/server";
import BlobFetch from "@/data/controls/blobs/blobFetch";
import BlobCreate from "@/data/controls/blobs/blobCreate";
import BlobUpdate from "@/data/controls/blobs/blobUpdate";
import BlobSync from "@/data/controls/blobs/blobSync";
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
  const key = "alaska";

  try {
    const filePath = path.resolve(`./data/${key}Vets.json`);
    const local = await readFile(filePath, "utf-8");
    const data = JSON.parse(local);
    return NextResponse.json({
      timestamp: data?.timestamp,
      state: key,
      count: data?.count,
      blob: data?.results,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: `Failed to read local ${key} data` + (error as Error).message,
      status: 500,
    });
  }

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