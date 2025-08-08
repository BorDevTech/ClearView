import { put } from "@vercel/blob";

type Payload = {
    timestamp: string;
    state: string;
    results: any[];
};

export default async function BlobUpdate(blobKey: string, payload: Payload = {
    timestamp: "",
    state: "",
    results: []
}, options?: { token?: string }) {
    const token = options?.token ?? process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("Missing Blob token, failed to Update");
    const blob = await put(blobKey, JSON.stringify(payload, null, 2), {
        access: "public",
        contentType: "application/json",
        token,
    });
    return blob;
} 