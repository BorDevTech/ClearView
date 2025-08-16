import { writeFile, access, readFile } from "fs/promises";
import { constants } from "fs";

export default async function BlobConvert(region: string, fullBlob: object[]) {
    const filePath = `./data/${region}Vets.json`;
    const incomingCount = Array.isArray(fullBlob) ? fullBlob.length : 0;

    if (incomingCount === 0) {
        console.warn(`⚠️ Incoming blob for ${region} is empty. Skipping write.`);
        return;
    }

    try {
        await access(filePath, constants.F_OK);
        const existingRaw = await readFile(filePath, "utf-8");
        const existingBlob = JSON.parse(existingRaw);
        const existingCount = Array.isArray(existingBlob) ? existingBlob.length : 0;

        if (incomingCount > existingCount) {
            console.log(`📈 Incoming blob (${incomingCount}) is larger than local file (${existingCount}). Overwriting...`);
            await writeFile(filePath, JSON.stringify(fullBlob, null, 2), "utf-8");
        } else if (incomingCount === existingCount) {
            console.log(`🛑 Local file and blob both have ${incomingCount} entries. Skipping write.`);
        } else {
            console.log(`📉 Incoming blob (${incomingCount}) has fewer results than local file (${existingCount}). Skipping write.`);
        }
    } catch {
        console.log(`📁 ${filePath} not found. Creating new file with ${incomingCount} entries.`);
        await writeFile(filePath, JSON.stringify(fullBlob, null, 2), "utf-8");
    }
}
