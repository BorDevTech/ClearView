// app/api/verify/arizona/convertCSV.ts
import { readFile, writeFile } from "fs/promises";
import { parse } from "csv-parse/sync";

interface VetEntry {
    SEARCH_ID: string;
    FIRST_NAME: string;
    LAST_NAME: string;
    LICENSE_TYPE: string;
    LICENSE_NUMBER: string;
    LICENSE_STATUS: string;
    LICENSE_EXPIRY_DATE: string;

}

type RawVetEntry = Record<string, string>;

// Resolve paths relative to this module
const csvUrl = new URL("./arizonaVets.csv", import.meta.url);
const jsonUrl = new URL("./arizonaVets.json", import.meta.url);

async function convertCsvToJson() {
    // 1) Read CSV
    const csvContent = await readFile(csvUrl, "utf-8");

    // 2) Parse
    const rawRecords = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        ltrim: true,
        rtrim: true,
    }) as RawVetEntry[];
    console.log(`📄 Detected ${rawRecords.length} CSV lines.`);

    // 3) Filter for “Veterinarian”
    const filtered = rawRecords.filter((entry) =>
        entry.REGISTER_PROFILE_LABEL_LICENSE_TYPE === "Veterinarian (Regular)" &&
        entry.REGISTER_PROFILE_LABEL_LICENSE_STATUS === "Active"
    );
    console.log(
        `🩺 Found ${filtered.length} veterinarian records of ${rawRecords.length} total records.`
    );

    // 4) Map into strongly-typed VetEntry[]
    const records: VetEntry[] = filtered.map((e) => ({
        SEARCH_ID: e.REGISTER_PROFILE_LABEL_SEARCH_ID,
        FIRST_NAME: e.REGISTER_PROFILE_LABEL_FIRST_NAME,
        LAST_NAME: e.REGISTER_PROFILE_LABEL_LAST_NAME,
        LICENSE_TYPE: e.REGISTER_PROFILE_LABEL_LICENSE_TYPE,
        LICENSE_NUMBER: e.REGISTER_PROFILE_LABEL_LICENSE_NUMBER,
        LICENSE_STATUS: e.REGISTER_PROFILE_LABEL_LICENSE_STATUS,
        LICENSE_EXPIRY_DATE: e.REGISTER_PROFILE_LABEL_LICENSE_EXPIRY_DATE,

    }));
    console.log(`✅ ${records.length} veterinarian records after filtering.`);

    // 5) Write JSON
    await writeFile(jsonUrl, JSON.stringify(records, null, 2), "utf-8");
    console.log(`✅ Conversion complete. JSON saved to ${jsonUrl.pathname}`);
}

convertCsvToJson().catch((err) => {
    console.error("❌ Conversion failed:", err);
    process.exit(1);
});
