export const runtime = "edge";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { search } = new URL(request.url);
  const url = `https://licensesearch.alabama.gov/ASBVME${search}`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await response.text();
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}