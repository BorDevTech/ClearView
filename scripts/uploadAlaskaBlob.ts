import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

async function uploadBlob() {
    const filePath = path.join(__dirname, "../data/alaskaVets.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    const { url } = await put("alaskaVets.json", fileContent, {
        access: "public", // or "public" if you want open access
    });

    console.log("✅ Blob uploaded successfully:");
    console.log("🔗 URL:", url);
}

uploadBlob().catch((err) => {
    console.error("❌ Upload failed:", err);
});
