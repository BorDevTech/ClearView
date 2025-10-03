import { put } from "@vercel/blob";

/**
 * Creates a new blob in Vercel Blob storage.
 * @param region - The unique identifier (region) to create the blob under.
 * @returns The created blob's URL.
 */

export default async function BlobCreate(region: string) {
    const blobKey = `${region}Vets.json`;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("Missing Blob token, failed to Create");
    const createdBlob = await put(blobKey, JSON.stringify([], null, 2), {
        access: "public",
        contentType: "application/json",
        token
    });
    console.log(`✅ Created ${region} Blob Successfully: ${createdBlob.url}`);
    return createdBlob.url;
}