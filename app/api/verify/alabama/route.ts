export const runtime = "edge";
import type { NextRequest } from "next/server";
import { verify } from "./logic";
import BlobSync from "@/data/controls/blobs/blobSync";
import BlobCreate from "@/data/controls/blobs/blobCreate";
import BlobUpdate from "@/data/controls/blobs/blobUpdate";
import BlobFetch from "@/data/controls/blobs/blobFetch";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get("firstname") || "";
  const lastName = searchParams.get("lastname") || "";
  const licenseNumber = searchParams.get("license") || "";
  const key = "alabama";
  const url = `https://licensesearch.alabama.gov/ASBVME?${searchParams.toString()}`;

  const existingBlob = await BlobFetch(url, key);
  


}


} 