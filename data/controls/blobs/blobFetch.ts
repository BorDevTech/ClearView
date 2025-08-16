
import BlobCheck from "./blobCheck";


export default async function BlobFetch(
    region: string,

) {
    const blobKey = `${region}Vets.json`;
    try {

        // 🔍 Check for existing blob
        await BlobCheck(region);


        // 🔍 Pull existing blob
        const url = `${process.env.BLOB_STORE_URL}/${blobKey}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            },

        });

        if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ Fetched existing blob: ");
        return data;
    }
    catch (error) {
        console.log(`❌ Blob fetch failed: ${error}`);
        throw error;
    }


}