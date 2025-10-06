import { put } from "@vercel/blob";
import BlobCheck from "./blobCheck";
import BlobFetch from "./blobFetch";
import { count, time } from "console";

/**
 * Creates a new blob in Vercel Blob storage.
 * @param region - The unique identifier (region) to create the blob under.
 * @returns The created blob's URL.
 */

export default async function BlobCreate(region: string) {
    const blobKey = `${region}Vets.json`;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("Missing Blob token, failed to Create");
    if (!process.env.BLOB_STORE_URL) throw new Error("Missing Blob store URL, failed to Create");
    const existingBlob = await BlobCheck(region);

    if (!existingBlob) {
        const newBlob = await put(blobKey, JSON.stringify({
            timestamp: new Date().toISOString(),
            region,
            count: 0,
            results: [],
        }, null, 2), {
            access: "public",
            contentType: "application/json",
            token
        });
        console.log(`✅ new ${region} Blob Successfully: ${newBlob.url}`);
        return {
            created: true,
            timestamp: new Date().toISOString(),
            url: newBlob.url,
            region,
            count: 0
        };
    }
    console.log(`ℹ️ Blob already exists: ${blobKey}`);
    const existingBlobData = await BlobFetch(region);
    return {
        created: false,
        timestamp: existingBlobData.timestamp,
        url: `${process.env.BLOB_STORE_URL}/${blobKey}`,
        region,
        count: existingBlobData.count,
    };


}