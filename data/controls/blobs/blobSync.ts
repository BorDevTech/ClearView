import { VetResult } from "@/app/types/vet-result";
import BlobCheck from "./blobCheck";
import BlobCreate from "./blobCreate";
import BlobUpdate from "./blobUpdate";

export default async function BlobSync(region: string, results?: VetResult[]) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    try {
        // ☁️ Check if Vercel Blob exists
        const key = `${region}`;
        const blobKey = `${key}Vets.json`;




        const exists = await BlobCheck(blobKey, results, { token });
        if (!exists) {
            console.log("⚠️ Blob not found, creating...");
            // ☁️ Upload to Vercel Blob
            await BlobCreate(blobKey, { token });
        } else if (exists && results && results.length > 0) {
            const payload = {
                timestamp: new Date().toISOString(),
                state: key,
                results: results ?? [],
            };
            console.log("✅ Blob already exists")
            console.log("⚠️ Updating existing blob with new results...");

            const blob = await BlobUpdate(blobKey, payload, { token });

            console.log(`🚀 Uploaded to Blob: ${blob.url}`);
            console.log(`📥 Download URL: ${blob.downloadUrl}`);
        }
        else if (exists && results && results.length === 0) {
            console.log("ℹ️ Blob exists, but no new results to update.");
        }
        console.log("🔍 BlobCheck result:", exists);





    } catch (error) {
        console.error("❌ Blob upload failed:", error);
    }
}