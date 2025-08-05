// import type { NextRequest } from "next/server";

export async function GET(
  // request: NextRequest

) {
  return new Response(`<h1>${"<STATE>"}</h1>`, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
