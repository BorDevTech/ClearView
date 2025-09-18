import fs from "fs";
import pdf from "pdf-parse";
import Papa from "papaparse";

const pdfPath = "ABVMA_2025OnlineDirectoryL.pdf";
const csvPath = "typeG_vets.csv";

async function extractTypeG() {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);

  // Split text into lines
  const lines = data.text.split("\n").map(line => line.trim()).filter(Boolean);

  // Prepare CSV rows
  const results: string[][] = [
    ["LASTNAME", "FIRSTNAME", "TYPE", "CITY"]
  ];

  for (const line of lines) {
    // Adjust this logic as needed for your PDF's structure
    if (/\(G\)/.test(line) && !line.startsWith("(G) General Practice Registered Veterinarian")) {
      // Example: "Smith John (G) Edmonton"
      const parts = line.split(/\s+/);
      const lastName = parts[0] || "";
      const firstName = parts[1] || "";
      const typeIndex = parts.findIndex(p => /\(G\)/.test(p));
      const type = typeIndex !== -1 ? "(G)" : "";
      let city = "";
      if (typeIndex !== -1 && typeIndex < parts.length - 1) {
        city = parts.slice(typeIndex + 1).join(" ");
      }
      results.push([lastName, firstName, type, city]);
    }
  }

  const csv = Papa.unparse(results);
  fs.writeFileSync(csvPath, csv);
  console.log(`✅ Finished — total ${results.length - 1} vets with TYPE (G)`);
}

extractTypeG().catch(err => {
  console.error("Error during PDF text extraction:", err);
});
