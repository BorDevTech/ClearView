import { VetResult } from "@/app/types/vet-result";
import BlobCheck from "./blobCheck";
import BlobCreate from "./blobCreate";
import BlobUpdate from "./blobUpdate";

/**
 * * Creates a new blob in Vercel Blob storage.
 * @param region - The unique identifier (region) to sync.
 * @returns The blob's identifier.
 *
 * *Creates a new blob in Vercel Blob storage.
 * @param results - The results to be passed to the unique identifier (region).
 * @returns The results to be passed to blob.
 */


export default async function BlobSync(region: string, results?: VetResult[],) {
    // ☁️ Check if Vercel Blob exists 

    const blobKey = `${region}Vets.json`;
    try {
        const exists = await BlobCheck(region);
        if (!exists) {
            console.log("⚠️ Blob not found, creating...");
            // ☁️ Upload to Vercel Blob
            const createdBlob = await BlobCreate(blobKey);
            return createdBlob;
        }
        if (exists && results && results.length > 0) {
            const payload = {
                timestamp: new Date().toISOString(),
                state: region,
                count: results.length,
                results,
            };
            console.log("✅ Blob already exists")
            console.log("⚠️ Updating existing blob with new results...");

            const blob = await BlobUpdate(region, payload);

            console.log(`🚀 Uploaded to Blob: ${blob.url}`);
            console.log(`📥 Download URL: ${blob.downloadUrl}`);
            console.log(`✅ Sync to Blob Successful`);
            return blobKey;
        }
        if (exists && results && results.length === 0) {
            return console.log("ℹ️ Blob already exists, but no new results to update.");
        }

        return results;
    } catch (error) {
        console.error("❌ Blob upload failed:", error);
        return null;
    }
}