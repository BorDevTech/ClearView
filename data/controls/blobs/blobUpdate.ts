import { put } from "@vercel/blob";

/**
 * Updates the region specified blob in Vercel Blob storage.
 * @param region - The unique identifier (region) to sync.
 * @param payload - The payload to be passed to the unique identifier (region).
 * @param payload.timestamp - The timestamp of the data must read new Date().toISOString().
 * @param payload.region - The region of the data.
 * @param payload.count - The count of the results, must be results.length.
 * @param payload.results - The results array.
 * @returns The blob's identifier.
 */

type Payload = {
    timestamp: string;
    region: string;
    count: number
    results: any[];
};


export default async function BlobUpdate(region: string, payload: Payload) {
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