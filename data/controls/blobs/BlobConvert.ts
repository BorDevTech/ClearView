import { writeFile, access, readFile } from "fs/promises";
import { constants } from "fs";
import path from "path";

export default async function BlobConvert(region: string, fullBlob: { results: object[] }) {
    const filePath = `./data/${region}Vets.json`;
    console.log(`📍 Absolute path for ${region}:`, path.resolve(filePath));
    const incomingCount = fullBlob?.results?.length;

    console.log("new incoming count:", incomingCount)


    try {
        await access(filePath, constants.F_OK);
        const existingRaw = await readFile(filePath, "utf-8");
        const existingBlob = JSON.parse(existingRaw);
        const existingCount = existingBlob.results.length;


        if (incomingCount > existingCount) {
            console.log(`📈 Incoming blob (${incomingCount}) is larger than local file (${existingCount}). Overwriting...`);
            await writeFile(filePath, JSON.stringify(fullBlob, null, 2), "utf-8");
        }

        if (incomingCount === 0) {
            console.warn(`⚠️ Incoming blob for ${region} has ${incomingCount} new entries. local has ${existingCount} entries. Skipping write.`);
            return;
        }
        if (incomingCount === existingCount) {
            console.log(`📊 Incoming blob (${incomingCount}) matches local file (${existingCount}). No changes made.`);
            return;
        }

        if (incomingCount < existingCount) {
            console.log(`📉 Incoming blob (${incomingCount}) has fewer results than local file (${existingCount}). Skipping write. consult Admin to inspect this blob @-- admin@bordevtech.com`);
        }
    } catch {
        console.log(`📁 ${filePath} not found. Creating new file with ${incomingCount} entries.`);
        await writeFile(filePath, JSON.stringify(fullBlob, null, 2), "utf-8");
    }
}
