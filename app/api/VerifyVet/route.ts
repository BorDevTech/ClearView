import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Forward all query string parameters from the incoming request
  const { search } = new URL(request.url);
  // Read the raw form data from the request body
  const formBody = await request.text();

  // Forward the request to the DBPR endpoint with all params and form data
  const url = `https://www.myfloridalicense.com/wl11.asp${search}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Referer: "https://www.myfloridalicense.com/wl11.asp",
        Origin: "https://www.myfloridalicense.com",
      },
      body: formBody,
    });
    const data = await response.text();
    return new Response(data, {
      headers: { "Content-Type": "text/html" },
      status: response.status,
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
