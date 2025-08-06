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
  DateIssued: Date | null;
  DateEffective: Date | null;
  DateExpired: Date | null;
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

// ✅ Filter for Veterinary + Veterinarian only
const filteredRecords = rawRecords.filter((entry: any) =>
  entry["Program"]?.trim() === "Veterinary" &&
  entry["ProfType"]?.trim() === "Veterinarian"
);

console.log(`🩺 Found ${filteredRecords.length} veterinarian records of ${rawRecords.length} total records.`);

// Transform to VetEntry[]
const records: VetEntry[] = filteredRecords.map((entry: any) => ({
  Program: entry["Program"],
  ProfType: entry["ProfType"],
  LicenseNum: entry["LicenseNum"],
  DBA: entry["DBA"],
  Owners: entry["Owners"],
  Status: entry["Status"],
  DateIssued: entry["DateIssued"] ? new Date(entry["DateIssued"]) : null,
  DateEffective: entry["DateEffective"] ? new Date(entry["DateEffective"]) : null,
  DateExpired: entry["DateExpired"] ? new Date(entry["DateExpired"]) : null,
  ADDRESS1: entry["ADDRESS1"],
  ADDRESS2: entry["ADDRESS2"],
  CITY: entry["CITY"],
  STATE: entry["STATE"],
  ZIP: entry["ZIP"] ? entry["ZIP"].toString() : "",
}));

// Write to JSON
const outputPath = path.join(__dirname, "../data/alaskaVets.json");
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));

console.log("✅ Conversion complete. JSON saved to alaskaVets.json.");


console.log(`✅ ${records.length} Veterinarian CSV records converted to JSON successfully.`);
