export const runtime = "edge";
import type { NextRequest } from "next/server";
import { verify } from "./logic";
import BlobCheck from "@/data/controls/blobs/blobCheck";
import BlobSync from "@/data/controls/blobs/blobSync";
import BlobCreate from "@/data/controls/blobs/blobCreate";
import BlobUpdate from "@/data/controls/blobs/blobUpdate";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get("firstname") || "";
  const lastName = searchParams.get("lastname") || "";
  const licenseNumber = searchParams.get("license") || "";
  const key = "alabama";
  const blobKey = `${key}Vets.json`;

  // 🔍 Check for existing blob
  const existingBlob = await BlobCheck(key);

  if (existingBlob) {
    try {
      const url = `${process.env.BLOB_STORE_URL}/${blobKey}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        },

      });
      const data = await response.json();
      console.log(`✅ Fetched existing blob: ${data}`);
      return Response.json(data, {
        status: response.status,
      });

    } catch (error) {
      return Response.json(
        {
          error: error instanceof Error ? error.message : "Failed to fetch Alaska data",
        },
        { status: 500 }
      );
    }

  }
  // If blob does not exist, fetch and parse HTML, then create/update blob

  if (!existingBlob) {
    // 🌐 Fallback: fetch HTML and parse
    const url = `https://licensesearch.alabama.gov/ASBVME?${searchParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "text/html",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
    });

    const results = await verify({ firstName, lastName, licenseNumber }); // 👈 verify now parses HTML directly
    await BlobCreate(key);
    await BlobUpdate(key, {
      timestamp: new Date().toISOString(),
      state: key,
      results
    });
    // Optionally, sync the blob after update
    const blob = await BlobSync(key, results);

    const html = await response.text();
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
      status: response.status,
    });
  }


} 