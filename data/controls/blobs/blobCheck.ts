import { VetResult } from "@/app/types/vet-result";
import { list } from "@vercel/blob";

export default async function BlobCheck(blobKey: string, data: VetResult[] = [], options?: { token?: string }) {
    const token = options?.token ?? process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("Missing Blob token");
    try {
        const historicBlobs = await list();
        return historicBlobs.blobs.some((blob) => blob.pathname === blobKey);

    } catch (error) {
        console.warn(`⚠️ Failed to list blobs for ${blobKey}:`, error);
        return false;

    }

}
