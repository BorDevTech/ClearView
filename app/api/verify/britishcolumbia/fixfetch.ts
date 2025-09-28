#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";
import { VetResult } from "@/app/types/vet-result";

const filePath = path.resolve(
  process.cwd(),
  "app/api/verify/britishcolumbia/britishcolumbiaVets.json"
);

const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// If it's in resume format, grab the results array
const results: VetResult[] = Array.isArray(raw) ? raw : raw.results || [];

const updated = results.map(v => {
  let firstName = "";
  let lastName = "";

  if (v.name.includes(",")) {
    const parts = v.name.split(",").map(s => s.trim());
    lastName = parts[0] || "";
    firstName = parts[1] || "";
  } else {
    const parts = v.name.split(" ").map(s => s.trim());
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  }

  return {
    ...v,
    firstName,
    lastName
  };
});

// Write back in the same resume format
const output = {
  progressPercent: raw.progressPercent ?? 100.0,
  results: updated
};

fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");
console.log(`✅ Updated ${updated.length} records with firstName/lastName fields`);
