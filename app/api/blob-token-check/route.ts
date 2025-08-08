export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return Response.json({ token: token ? "✅ Token loaded" : "❌ Token missing" });
}
