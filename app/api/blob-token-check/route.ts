export async function GET() {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    console.log(process.env.BLOB_READ_WRITE_TOKEN);
    console.log("🔐 Token loaded:", !!process.env.BLOB_READ_WRITE_TOKEN);

    return Response.json({
        status: token ? "✅ Token loaded" : "❌ Token missing",
        token: token ? "hidden for security" : null,
    });
}
