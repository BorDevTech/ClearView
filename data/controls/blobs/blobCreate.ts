import { put } from "@vercel/blob";

export default async function BlobCreate(blobKey: string) {
    await put(blobKey, JSON.stringify([], null, 2), {
        access: "public",
        contentType: "application/json",
    });
}