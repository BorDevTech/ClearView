import { list } from "@vercel/blob";

/**
 * Checks if a blob exists in Vercel Blob storage.
 * @param blobKey - The unique identifier (region) for the blob to check.
 * @returns True if the blob exists, false otherwise.
 */

export default async function BlobCheck(key: string) {
    const blobKey = `${key}Vets.json`;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    // if (!token) throw new Error("Missing Blob token, failed to Check");

    try {
        const historicBlobs = await list({ token: token });
        // console.log("🔍 Historic Blobs:", historicBlobs);
        return historicBlobs.blobs.some((blob) => blob.pathname === blobKey);

    } catch (error) {
        console.warn(`⚠️ Failed to list blobs for ${blobKey}:`, error);
        return false;

    }
}
