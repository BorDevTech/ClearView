import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // Load environment variables from .env file

async function uploadBlob() {
    const filePath = path.join(__dirname, "../data/alaskaVets.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    console.log("🔍 Token:", process.env.BLOB_READ_WRITE_TOKEN);

    const { url } = await put("alaskaVets.json", fileContent, {
        access: "public", // or "public" if you want open access
        token: process.env.BLOB_READ_WRITE_TOKEN, // Ensure this environment variable is set
    });

    console.log("✅ Blob uploaded successfully:");
    console.log("🔗 URL:", url);
}

uploadBlob().catch((err) => {
    console.error("❌ Upload failed:", err);
});
