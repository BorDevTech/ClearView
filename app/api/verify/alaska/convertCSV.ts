import * as fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

interface VetEntry {
  Program: string;
  ProfType: string;
  LicenseNum: string;
  DBA: string;
  Owners: string;
  Status: string;
  DateIssued: Date;
  DateEffective: Date;
  DateExpired: Date;
  ADDRESS1: string;
  ADDRESS2: string;
  CITY: string;
  STATE: string;
  ZIP: string;
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
  Program: entry["Program"],
  ProfType: entry["ProfType"],
  LicenseNum: entry["LicenseNum"],
  DBA: entry["DBA"],
  Owners: entry["Owners"],
  Status: entry["Status"],
  DateIssued: new Date(entry["DateIssued"]),
  DateEffective: new Date(entry["DateEffective"]),
  DateExpired: new Date(entry["DateExpired"]),
  ADDRESS1: entry["ADDRESS1"],
  ADDRESS2: entry["ADDRESS2"],
  CITY: entry["CITY"],
  STATE: entry["STATE"],
  ZIP: parseInt(entry["ZIP"], 10),
}));

// Write to JSON
const outputPath = path.join(__dirname, "alaskaVets.json");
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));

console.log("✅ Conversion complete. JSON saved to alaskaVets.json.");


console.log(`✅ ${records.length} Veterinarian CSV records converted to JSON successfully.`);
