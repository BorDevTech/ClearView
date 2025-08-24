import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = "alberta";

  const url = "https://abvma.in1touch.org/client/roster/clientRosterView.html";
  return new Response(`<h1>${"<STATE>"}</h1>`, { status: 200, headers: { "Content-Type": "text/html" } });
}