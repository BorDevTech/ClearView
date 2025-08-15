import { put } from "@vercel/blob";


/**
 * Updates the region specified blob in Vercel Blob storage.
 * @param region - The unique identifier (region) to sync.
 * @returns The blob's identifier.
 */

type Payload = {
    timestamp: string;
    state: string;
    results: any[];
};

export default async function BlobUpdate(region: string, payload: Payload = {
    timestamp: new Date().toISOString(),
    state: region,
    results: []
}) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("Missing Blob token, failed to Update");
    const blob = await put(`${region}Vets.json`, JSON.stringify(payload, null, 2), {
        access: "public",
        contentType: "application/json",
        token,
        allowOverwrite: true
    });
    console.log(`✅ Updated Blob: ${blob.url}`);
    return blob;
} 