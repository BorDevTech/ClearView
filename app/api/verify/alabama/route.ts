import { NextResponse, type NextRequest } from "next/server";
import BlobSync from "@/data/controls/blobs/blobSync";
import BlobCreate from "@/data/controls/blobs/blobCreate";
import BlobUpdate from "@/data/controls/blobs/blobUpdate";
import BlobFetch from "@/data/controls/blobs/blobFetch";
import BlobConvert from "@/data/controls/blobs/BlobConvert";
import { verify } from "./logic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get("firstname") || "";
  const lastName = searchParams.get("lastname") || "";
  const licenseNumber = searchParams.get("license") || "";

  const key = "alabama";

  try {
    const data = await BlobFetch(key);
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`⚠️ Blob for ${key} is empty, triggering fallback to live parse for ${key}`);
      throw new Error("Empty blob");
    }
    // ✅ Convert and write blob immediately after fetch
    await BlobConvert(key, data);

    return NextResponse.json({
      blob: data,
      count: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    // If blob does not exist, fetch and parse, then create/update blob
    try {
      // 🌐 Fetch Alabama portal HTML
      const url = `https://licensesearch.alabama.gov/ASBVME`;
      const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await response.text();
      // console.log(`🔍 Fetched Alabama vet data: ${html}`);
      // // Forward all query string parameters from the incoming request
      // const { search } = new URL(request.url);
      // 🧠 Parse HTML using verify()
      const results = verify.parse(html);

      console.log(`✅ Parsed ${results} results for ${key}`);
      console.log(`🧪 Sample result:`, results[0]);
      if (results.length === 0) throw new Error("No results parsed from HTML");


      // const results = await verify({ firstName, lastName, licenseNumber }); // 👈 verify now parses HTML directly
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
    }
  }
}
