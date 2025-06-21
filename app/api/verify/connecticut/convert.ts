import * as fs from "fs";
import { parse } from "csv-parse";

interface VetEntry {
  last_name: string;
  first_name: string;
  status: string;
  current: string;
  license_number: string;
  issue_date: string;
  expiration_date: string;
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
      last_name: row["LAST NAME"] || "",
      first_name: row["FIRST NAME"] || "",
      status: row["STATUS"] || "",
      current: row["REASON"] || "",
      license_number: row["LICENSE NO."] || "",
      issue_date: row["ISSUE DATE"] || "",
      expiration_date: row["EXPIRATION DATE"] || "",
      formatted_name: [row["FIRST NAME"], row["MIDDLE NAME"], row["LAST NAME"]]
        .filter(Boolean)
        .join(" "),
    };
    results.push(entry);
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`Done! Wrote ${results.length} records to ${outputPath}`);
}

// Example usage
convertTabDelimitedToJson(
  "e:\\GitHub\\ClearView\\ClearView\\app\\api\\verify\\colorado\\Veterinarian.txt",
  "e:\\GitHub\\ClearView\\ClearView\\app\\api\\verify\\colorado\\VET.json"
);
