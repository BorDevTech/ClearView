import { NextResponse, type NextRequest } from "next/server";
import BlobConvert from "@/data/controls/blobs/BlobConvert";
import BlobCreate from "@/data/controls/blobs/blobCreate";
import BlobFetch from "@/data/controls/blobs/blobFetch";
import BlobSync from "@/data/controls/blobs/blobSync";
import BlobUpdate from "@/data/controls/blobs/blobUpdate";

export async function GET(request: NextRequest) {

  const key = "connecticut";
  const { search } = new URL(request.url);
  const url =
    "https://raw.githubusercontent.com/BorDevTech/ClearView/refs/heads/main/data/connecticutVets.json" +
    (search || "");

  try {
    const blobData = await BlobFetch(key);
    // ✅ Convert and write blob immediately after fetch
    await BlobConvert(key, blobData);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });
    const data = await response.text();
    return new Response(data, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      status: response.status,
    });
  } catch (error: unknown) {
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