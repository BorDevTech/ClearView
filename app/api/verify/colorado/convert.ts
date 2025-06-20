import * as fs from "fs";
import { parse } from "csv-parse";

interface VetEntry {
  last_name: string;
  first_name: string;
  middle_name: string;
  suffix: string;
  license_number: string;
  license_expiration_date: string;
  license_status_description: string;
  title: string;
  formatted_name: string;
}

async function convertTabDelimitedToJson(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const parser = fs.createReadStream(inputPath).pipe(
    parse({
      delimiter: "\t",
      columns: true,
      trim: true,
      skipEmptyLines: true,
    })
  );

  const results: VetEntry[] = [];
  for await (const row of parser) {
    const entry: VetEntry = {
      last_name: row["Last Name"] || "",
      first_name: row["First Name"] || "",
      middle_name: row["Middle Name"] || "",
      suffix: row["Suffix"] || "",
      formatted_name: row["Formatted Name"] || "",
      license_number: row["License Number"] || "",
      license_expiration_date: row["License Expiration Date"] || "",
      license_status_description: row[" License Status Description"] || "",
      title: row["Title"] || "",
    };
    results.push(entry);
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`Done! Wrote ${results.length} records to ${outputPath}`);
}

// Example usage
convertTabDelimitedToJson(
  "e:\\GitHub\\ClearView\\ClearView\\app\\api\\verify\\colorado\\VET_-_Veterinarian_-_All_Statuses.txt",
  "e:\\GitHub\\ClearView\\ClearView\\app\\api\\verify\\colorado\\VET.json"
);
