"use server";

import fs from "fs/promises";
import path from "path";
import { VetResult } from "@/app/types/vet-result";

export async function verify({
  firstName,
  lastName,
  licenseNumber,
}: {
  firstName: string;
  lastName: string;
  licenseNumber: string;
}): Promise<VetResult[]> {
  const filePath = path.join(
    process.cwd(),
    "app",
    "api",
    "verify",
    "missouri",
    "VET.json"
  );
  const file = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(file);

  console.log("VET.json found!");
  console.log(`Fetched ${data.length} records from VET.json.`);

  // ...your filtering logic here...

  return [];
}

export async function logVetJsonInfo() {
  const filePath = path.join(process.cwd(), "app", "api", "verify", "missouri", "VET.json");
  const file = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(file);
  console.log("VET.json found!");
  console.log(`Fetched ${data.length} records from VET.json.`);
  // ...rest of your logic
}
