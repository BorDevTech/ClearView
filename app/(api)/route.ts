import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Parse query params from the request
  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const licenseNumber = searchParams.get("licenseNumber") || "";

  // Build the form body as x-www-form-urlencoded
  const form: Record<string, string> = {
    hDivision: "ALL",
    hAction: "",
    SearchRefine: "Search",
    hCurrPage: "1",
    hTotalPages: "",
    hSearchType: "Name",
    hRecsPerPage: "1000",
    hBoard: "26",
  };
  if (firstName) form.hFirstName = firstName;
  if (lastName) form.hLastName = lastName;
  if (licenseNumber) form.hLicense = licenseNumber;

  // Convert form object to x-www-form-urlencoded string
  const formBody = Object.entries(form)
    .map(
      ([key, value]) =>
        encodeURIComponent(key) + "=" + encodeURIComponent(value)
    )
    .join("&");

  // Query params
  const url = "https://www.myfloridalicense.com/wl11.asp?mode=3&search=Name";

  // Get cookies from the incoming request if present
  const cookie = request.headers.get("cookie") || "";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(cookie ? { Cookie: cookie } : {}),
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