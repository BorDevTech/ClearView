import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { search } = new URL(request.url);
  const url =
    "https://raw.githubusercontent.com/BorDevTech/ClearView/refs/heads/main/app/api/verify/colorado/VET.json" +
    (search || "");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
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
