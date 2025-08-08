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
}) {
    const blob = await put(blobKey, JSON.stringify(payload, null, 2), {
        access: "public",
        contentType: "application/json",
    });
    return blob;
} 