import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { search } = new URL(request.url);
  // Forward the GET request to the Alabama license search page
  const url = "https://licensesearch.alabama.gov/ASBVME";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
        Referer: "https://licensesearch.alabama.gov/ASBVME",
        Origin: "https://licensesearch.alabama.gov/ASBVME",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
      },
    });
    const data = await response.text();
    return new Response(data, {
      headers: { "Content-Type": "text/html" },
      status: response.status,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch data",
      },
      { status: 500 }
    );
  }
}
