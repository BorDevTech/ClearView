import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const formBody = await request.text();
  const url = "https://delpros.delaware.gov/apexremote";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Referer: "https://delpros.delaware.gov/OH_VerifyLicense",
        Origin: "https://delpros.delaware.gov",
      },
      body: formBody,
    });
    const data = await response.text();
    return new Response(data, {
      headers: { "Content-Type": "application/json" },
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
