import BlobSync from "@/data/controls/blobs/blobSync";


export async function POST(request: Request) {
    const { blobKey } = await request.json();
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return new Response("Missing token", { status: 401 });

    await BlobSync(blobKey);
    return new Response("Sync complete", { status: 200 });
}
