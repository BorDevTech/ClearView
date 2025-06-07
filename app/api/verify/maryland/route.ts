import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Parse the incoming URL and query params
  const urlObj = new URL(request.url);
  const searchParams = urlObj.searchParams;

  // Read the raw form data from the request body (assuming JSON)
  const formBody = await request.text();
  let firstName = "";
  let lastName = "";

  try {
    // Try to parse JSON body for firstName and lastName
    const body = JSON.parse(formBody);
    firstName = body.firstName || "";
    lastName = body.lastName || "";
  } catch {
    // fallback: try to parse as URL-encoded if needed
    const params = new URLSearchParams(formBody);
    firstName = params.get("firstName") || "";
    lastName = params.get("lastName") || "";
  }

  // Update the filter param with the full name (adjust as needed by the API)
  const fullName = `${firstName} ${lastName}`.trim();

  // Set the filter param (decoded: filter[d397e5b8-81c5-ea26-f386-0203d295b518])
  searchParams.set("filter[d397e5b8-81c5-ea26-f386-0203d295b518]", fullName);

  // Build the Maryland endpoint URL
  const url = `https://onestop.md.gov/list_views/662fee43557f9400f4cdd80d/entries?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json, text/javascript, */*; q=0.01",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
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
