// app/api/verify/alberta/convertCSV.ts
import { readFile, writeFile } from "fs/promises";
import { parse } from "csv-parse/sync";

interface VetEntry {
    LAST_NAME: string;
    FIRST_NAME: string;
    TYPE: string;
    LICENSE: string;
}

type RawVetEntry = Record<string, string>;

// Resolve paths relative to this module
const csvUrl = new URL("./albertaVets.csv", import.meta.url);
const jsonUrl = new URL("./albertaVets.json", import.meta.url);

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
        entry.TYPE?.toLowerCase().includes("veterinarian")
    );
    console.log(
        `🩺 Found ${filtered.length} veterinarian records of ${rawRecords.length} total records.`
    );

    // 4) Map into strongly-typed VetEntry[]
    const records: VetEntry[] = filtered.map((e) => ({
        LAST_NAME: e.LAST_NAME,
        FIRST_NAME: e.FIRST_NAME,
        TYPE: e.TYPE,
        LICENSE: e.LICENSE,
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
