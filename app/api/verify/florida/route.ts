import type { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  // Path to your test file
  const filePath = path.join(
    process.cwd(),
    "app/api/verify/florida/test-data.json"
  );
  const file = await fs.readFile(filePath, "utf-8");
  const { html } = JSON.parse(file);

  return new Response(html, {
    headers: { "Content-Type": "text/html,json" },
    status: 200,
  });
}

export async function GET(request: NextRequest) {
  return new Response("OK", { status: 200 });
}

// V2
// return new Response("OK");
// V1
// // Forward all query string parameters from the incoming request
// const { search } = new URL(request.url);
// // Read the raw form data from the request body
// const formBody = await request.text();
// // Forward the request to the DBPR endpoint with all params and form data
// const url = `https://www.myfloridalicense.com/wl11.asp${search}`;
// try {
//   console.log("Received search params:", search);
//   console.log("Received form body:", formBody);
//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//       "User-Agent":
//         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
//       Referer: "https://www.myfloridalicense.com/wl11.asp",
//       Origin: "https://www.myfloridalicense.com",
//     },
//     body: formBody,
//   });
//   const data = await response.text();
//   return new Response(data, {
//     headers: { "Content-Type": "text/html" },
//     status: response.status,
//   });
// } catch (error) {
//   // Remove unused variable warning by using the error in the response
//   return Response.json(
//     {
//       error: error instanceof Error ? error.message : "Failed to fetch data",
//     },
//     { status: 500 }
//   );
// }
// }
