import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Forward all query string parameters from the incoming request
  const { search } = new URL(request.url);
  const url =
    "https://ws.bvm.nm.gov/api/public/DataAccess/publicLicenseSearch/Public/" +
    (search || "");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Referer: "https://online.bvm.nm.gov",
        Origin: "https://online.bvm.nm.gov",
        Accept: "*/*",
      },
    });
    const data = await response.text();
    return new Response(data, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
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
