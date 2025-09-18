import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface VetEntry {
    FirstName: string;
    LastName: string;
    LicenseNum: string;
    Status: string;
    City: string;
}

// Load the CSV file
const csvPath = path.join(__dirname, "alaskaVets.csv");
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
    entry["Program"]?.trim() === "Veterinary" &&
    entry["ProfType"]?.trim() === "Veterinarian"
);

console.log(`🩺 Found ${filteredRecords.length} veterinarian records of ${rawRecords.length} total records.`);

// Transform to VetEntry[]
const records: VetEntry[] = filteredRecords.map((entry: RawVetEntry) => ({
    FirstName: entry["First Name"]?.split(",")[1]?.trim() || "",
    LastName: entry["Last Name"]?.split(",")[0]?.trim() || "",
    LicenseNum: entry["LicenseNum"],
    Status: entry["Status"],
    City: entry["City"],
}));

// Write to JSON
const outputPath = path.join(__dirname, "alaskaVets.json");
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));

console.log("✅ Conversion complete. JSON saved to alaskaVets.json.");


console.log(`✅ ${records.length} Veterinarian CSV records converted to JSON successfully.`);
