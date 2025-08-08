import { VetResult } from "@/app/types/vet-result";
import BlobCheck from "./blobCheck";
import BlobCreate from "./blobCreate";
import BlobUpdate from "./blobUpdate";

export default async function BlobSync(region: string, results: VetResult[]) {
    try {
        // ☁️ Check if Vercel Blob exists
        const key = `${region}`;
        const blobKey = `${key}Vets.json`;

        const payload = {
            timestamp: new Date().toISOString(),
            state: key,
            results,
        };


        const exists = await BlobCheck(blobKey);
        if (!exists) {
            console.log("⚠️ Blob not found, creating...");
            // ☁️ Upload to Vercel Blob
            await BlobCreate(blobKey);
        }
        else if (results.length > 0) {
            console.log("✅ Blob already exists")
            console.log("⚠️ Updating existing blob with new results...");

            const blob = await BlobUpdate(blobKey, payload);

            console.log(`🚀 Uploaded to Blob: ${blob.url}`);
            console.log(`📥 Download URL: ${blob.downloadUrl}`);
        }
        console.log("🔍 BlobCheck result:", exists);





    } catch (error) {
        console.error("❌ Blob upload failed:", error);
    }
}