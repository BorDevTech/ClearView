import { put } from "@vercel/blob";

export default async function BlobCreate(blobKey: string, options?: { token?: string }) {
    const token = options?.token ?? process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("Missing Blob token");
    await put(blobKey, JSON.stringify([], null, 2), {
        access: "public",
        contentType: "application/json",
        token
    });
}