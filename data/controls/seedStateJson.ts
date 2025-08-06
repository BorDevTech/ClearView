import fs from "fs";
import path from "path";

console.log("🚀 Starting seedStateJson script...");

const activeRegions = [
  "alabama", "alaska", "alberta", "arizona", "arkansas", "britishcolumbia",
  "california", "colorado", "connecticut", "delaware", "districtOfColumbia",
  "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa",
  "kansas", "kentucky", "louisiana", "maine", "manitoba", "maryland",
  "massachusetts", "michigan", "minnesota", "mississippi", "missouri",
  "montana", "nebraska", "nevada", "newbrunswick", "newhampshire",
  "newjersey", "newmexico", "newyork", "newfoundland&labrador",
  "northcarolina", "northdakota", "novascotia", "ohio", "oklahoma",
  "ontario", "oregon", "pennsylvania", "princeedwardisland", "puertorico",
  "quebec", "rhodeisland", "saskatchewan", "southcarolina", "southdakota",
  "tennessee", "texas", "utah", "vermont", "virginia", "washington",
  "westvirginia", "wisconsin", "wyoming"
];

console.log("📦 Loaded", activeRegions.length, "regions");

const dataDir = path.join(__dirname, "..");
console.log("📁 Data directory resolved to:", dataDir);

for (const region of activeRegions) {
  const cleanedName = region.replace(/[^a-zA-Z]/g, "");
  const fileName = `${cleanedName}Vets.json`;
  const filePath = path.join(dataDir, fileName);

  console.log(`📝 Processing ${region} → ${fileName}`);

  try {
    if (fs.existsSync(filePath)) {
      console.log(`⏭️ Skipped ${fileName} — already exists.`);
      continue;
    }

    fs.writeFileSync(filePath, JSON.stringify([]));
    console.log(`✅ Created ${fileName}`);
  } catch (err) {
    console.error(`❌ Error with ${fileName}:`, err);
  }
}

console.log("🎉 Script completed.");
