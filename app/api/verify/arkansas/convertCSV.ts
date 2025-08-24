import * as fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

interface VetEntry {
    first_name: string;
    last_name: string;
    work_city: string;
    state: string;
    license_num: string;
    license_type: string;
    license_status: string;
}

// Load the CSV file
const csvPath = path.join(__dirname, "arkansasVets.csv");

if (!fs.existsSync(csvPath)) {
    throw new Error(`Missing CSV file at ${csvPath}`);
}

const csvContent = fs.readFileSync(csvPath, "utf-8");

const rawRecords = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
});
// ✅ Log how many lines were detected
console.log(`📄 Detected ${rawRecords.length} CSV lines.`);

type RawVetEntry = {
    [key: string]: string;
};

// ✅ Filter for Veterinary + Veterinarian only
const filteredRecords = rawRecords.filter((entry: RawVetEntry) =>
    entry["License_Status"]?.trim() === "Active" &&
    entry["License_Type"]?.trim() === "Vet"
);

console.log(`🩺 Found ${filteredRecords.length} veterinarian records of ${rawRecords.length} total records.`);

// Transform to VetEntry[]
const records: VetEntry[] = filteredRecords.map((entry: RawVetEntry) => ({
    first_name: entry["First_Name"],
    last_name: entry["Last_Name"],
    work_city: entry["Work City"],
    state: entry["State"],
    license_num: entry["License_Num"],
    license_type: entry["License_Type"],
    license_status: entry["License_Status"],
}));

// Write to JSON
const outputPath = path.join(__dirname, "arkansasVets.json");
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));

console.log("✅ Conversion complete. JSON saved to arkansasVets.json.");


console.log(`✅ ${records.length} Veterinarian CSV records converted to JSON successfully.`);
