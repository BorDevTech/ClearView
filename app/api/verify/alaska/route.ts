import { NextRequest, NextResponse } from "next/server";
import BlobFetch from "@/data/controls/blobs/blobFetch";
import BlobCreate from "@/data/controls/blobs/blobCreate";
import BlobUpdate from "@/data/controls/blobs/blobUpdate";
import BlobSync from "@/data/controls/blobs/blobSync";
import BlobConvert from "@/data/controls/blobs/BlobConvert";


export async function GET(request: NextRequest) {
  const key = "alaska";
  const { search } = new URL(request.url);
  const url =
    "https://raw.githubusercontent.com/BorDevTech/ClearView/refs/heads/main/app/api/verify/missouri/VET.json" +
    (search || "");

  try {
    const data = await BlobFetch(key);
    // ✅ Convert and write blob immediately after fetch
    await BlobConvert(key, data);

    return NextResponse.json({
      blob: data,
      count: Array.isArray(data) ? data.length : 0,
    });
  } catch (error: unknown) {
    // // // 🌐 Fallback: fetch HTML and parse
    // const { verify } = await import(`./../../../app/api/verify/${key}/logic`);
    // // Forward all query string parameters from the incoming request
    // const { search } = new URL(request.url);
    // const results = await verify(search); // 👈 verify now parses HTML directly
    console.warn(`⚠️ BlobFetch failed for ${key}, falling back to live parse: ${error}`);
    // If blob does not exist, fetch and parse, then create/update blob
    ////
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
      });
      const data = await response.text();
      const results = JSON.parse(data);
      await BlobCreate(key);
      await BlobUpdate(key, {
        timestamp: new Date().toISOString(),
        state: key,
        results
      });
      // Optionally, sync the blob after update
      const blob = await BlobSync(key, results);
      return NextResponse.json({ count: results.length, blob, results });
    } catch (fallbackError) {
      return NextResponse.json({
        ok: false,
        error: fallbackError instanceof Error ? fallbackError.message : `Failed to fetch ${key} data`,
        status: 500,
      });
    };
  }
}