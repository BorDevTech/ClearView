

export async function GET() {
  const url = "https://tbvjhsvoecgza1uc.public.blob.vercel-storage.com/alaskaVets.json";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
    });

    const data = await response.json();
    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch Alaska data",
      },
      { status: 500 }
    );
  }
}
