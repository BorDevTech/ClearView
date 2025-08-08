export const runtime = "edge";
import type { NextRequest } from "next/server";
import { verify } from "./logic";
import BlobCheck from "@/data/controls/blobs/blobCheck";
import { VetResult } from "@/app/types/vet-result";
import BlobSync from "@/data/controls/blobs/blobSync";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get("firstname") || "";
  const lastName = searchParams.get("lastname") || "";
  const licenseNumber = searchParams.get("license") || "";
  const key = "alabama";
  const blobKey = `${key}Vets.json`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    // 🔍 Check for existing blob


    const existingBlob = await BlobCheck(blobKey, [], { token });

    if (existingBlob) {
      const blobRes = await fetch(`https://${blobKey}`);
      const allResults: VetResult[] = await blobRes.json();
      const filtered = allResults.filter((vet) =>
        vet.name?.toLowerCase().includes(lastName.toLowerCase()) &&
        vet.licenseNumber?.toLowerCase().includes(licenseNumber.toLowerCase())
      );
      if (filtered.length) {
        return Response.json({
          ok: true,
          count: filtered.length,
          blob: blobKey,
          results: filtered,
          source: "blob",
        });
      }
    }
    // 🌐 Fallback
    const results = await verify({ firstName, lastName, licenseNumber });
    const blob = await BlobSync(key, results); return Response.json({
      ok: true,
      count: results.length,
      blob,
      results,
      source: "live",
    });
  } catch (error) {
    console.error("Fallback HTML fetch:", error);
    const url = `https://licensesearch.alabama.gov/ASBVME${searchParams.toString()}`;
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await response.text();
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }
} 