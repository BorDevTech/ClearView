import { NextRequest, NextResponse } from "next/server";
import BlobFetch from "@/data/controls/blobs/blobFetch";
import BlobCreate from "@/data/controls/blobs/blobCreate";
import BlobUpdate from "@/data/controls/blobs/blobUpdate";
import BlobSync from "@/data/controls/blobs/blobSync";
import BlobConvert from "@/data/controls/blobs/BlobConvert";

export async function GET(request: NextRequest) {
  const key = "britishcolumbia";
  const { search } = new URL(request.url);
  const url =
    "https://raw.githubusercontent.com/BorDevTech/ClearView/refs/heads/main/app/api/verify/britishcolumbia/britishcolumbiaVets-FINAL.json" +
    (search || "");

  try {
    const blobData = await BlobFetch(key);
    await BlobConvert(key, blobData);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json"
      }
    });
    const data = await response.text();
    return new Response(data, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      status: response.status
    });
  } catch (error: unknown) {
    console.warn(`⚠️ BlobFetch failed for ${key}, falling back to live parse: ${error}`);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json"
        }
      });
      const data = await response.text();
      const results = JSON.parse(data);
      await BlobCreate(key);
      await BlobUpdate(key, {
        timestamp: new Date().toISOString(),
        region: key,
        count: results.length,
        results
      });
      const blob = await BlobSync(key, results);
      return NextResponse.json({ count: results.length, blob, results });
    } catch (fallbackError) {
      return NextResponse.json({
        ok: false,
        error: fallbackError instanceof Error ? fallbackError.message : `Failed to fetch ${key} data`,
        status: 500
      });
    }
  }
}
