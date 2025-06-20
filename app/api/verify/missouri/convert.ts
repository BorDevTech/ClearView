import * as fs from "fs";
import { parse } from "csv-parse";

interface VetEntry {
  prc_first_name: string;
  prc_middle_name: string;
  prc_last_name: string;
  prc_suffix: string;
  lic_profession: string;
  lic_number: string;
  lst_description: string;
  les_description: string;
  prc_dba_name: string;
  lic_orig_issue_date: string;
  lic_exp_date: string;
  prc_entity_name: string;
}

async function convertTabDelimitedToJson(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const parser = fs.createReadStream(inputPath).pipe(
    parse({
      delimiter: "\t",
      columns: true, // Treat first row as column names
      trim: true, // Trim whitespace
      skipEmptyLines: true,
    })
  );

  const results: VetEntry[] = [];
  for await (const row of parser) {
    const entry: VetEntry = {
      prc_first_name: row["prc_first_name"] || "",
      prc_middle_name: row["prc_middle_name"] || "",
      prc_last_name: row["prc_last_name"] || "",
      prc_suffix: row["prc_suffix"] || "",
      lic_profession: row["lic_profession"] || "",
      lic_number: row["lic_number"] || "",
      lst_description: row["lst_description"] || "",
      les_description: row["les_description"] || "",
      prc_dba_name: row["prc_dba_name"] || "",
      lic_orig_issue_date: row["lic_orig_issue_date"] || "",
      lic_exp_date: row["lic_exp_date"] || "",
      prc_entity_name: row["prc_entity_name"] || "",
    };
    results.push(entry);
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`Done! Wrote ${results.length} records to ${outputPath}`);
}

// Example usage
// convertTabDelimitedToJson(
//   'e:\\GitHub\\ClearView\\ClearView\\app\\api\\verify\\missouri\\VET.TXT',
//   'e:\\GitHub\\ClearView\\ClearView\\app\\api\\verify\\missouri\\VET.json'
// );
