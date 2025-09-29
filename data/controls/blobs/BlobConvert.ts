import { writeFile, access, readFile } from "fs/promises";
import { constants } from "fs";
import path from "path";


interface VetBlob {
    timestamp: string;
    state: string;
    count: number;
    results: object[];
}

export default async function BlobConvert(region: string, fullBlob: VetBlob) {
    // Ensure the data directory exists
    const filePath = `./data/${region}Vets.json`;
    console.log(`📍 Absolute path for ${region}:`, path.resolve(filePath));
    // Extract timestamp and count from incoming blob
    const incomingDate = new Date(fullBlob?.timestamp).getTime();
    const incomingCount = fullBlob?.count ?? 0;

    console.log("new incoming date:", incomingDate)



    try {
        // Check if file exists
        await access(filePath, constants.F_OK);
        // If it exists, read existing file to compare timestamps
        const existingRaw = await readFile(filePath, "utf-8");
        const existingBlob = JSON.parse(existingRaw);
        const existingDate = new Date(existingBlob?.timestamp).getTime();


        if (incomingDate > existingDate) {
            // Incoming blob is newer, overwrite local file
            console.log(`📈 Incoming blob (${incomingDate}) is newer than local file (${existingDate}). Overwriting...`

            );
            await writeFile(filePath, JSON.stringify(fullBlob, null, 2), "utf-8");
        }
        else if (incomingDate === existingDate) {
            // Timestamps are identical, no action needed
            console.log(`📊 Incoming blob matches local timestamp (${fullBlob.timestamp}). No changes made.`
            );

        }
        else if (incomingDate < existingDate) {
            // Incoming blob is older, skip write
            console.warn(`⚠️ Incoming blob (${fullBlob.timestamp}) is older than local (${existingBlob.timestamp}). Skipping write.`
            );
        }
    } catch {
        // File does not exist, create new file
        console.log(`📁 ${filePath} not found. Creating new file with ${incomingCount} entries.`

        );
        await writeFile(filePath, JSON.stringify(fullBlob, null, 2), "utf-8");
    }
}
