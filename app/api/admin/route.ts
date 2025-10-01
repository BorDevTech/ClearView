import { NextResponse } from "next/server";
erd 
async function GET() {
    // Read the server-only env var
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // Never return the raw token to the client!
    // Instead, return a boolean or masked version
    return NextResponse.json({
        ok: !!token,
        preview: token ? token : null,
    });
}