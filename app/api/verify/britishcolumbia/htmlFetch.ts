#!/usr/bin/env ts-node

/**
 * scripts/buildBritishColumbiaRoster.ts
 *
 * - Loops through two-letter firstname combinations to avoid CVBC 500 error
 * - Extracts GUID from Full Name link as `id`
 * - Keeps licenseNumber field empty for schema consistency
 * - Waits 3000ms between requests to avoid IP block
 * - Logs per-term and overall progress
 * - Flushes to disk every CHUNK_SIZE terms to avoid memory spikes
 * - Dedupes by id
 * - Writes JSON to app/api/verify/britishcolumbia/britishcolumbiaVets.json
 */

import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { VetResult } from "@/app/types/vet-result";

const OUT_JSON = path.resolve(
    process.cwd(),
    "app/api/verify/britishcolumbia/britishcolumbiaVets.json"
);

const DELAY_MS = 3000;
const CHUNK_SIZE = 10; // flush every 10 terms
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type BCFileFormat = {
    progressPercent: number;
    results: VetResult[];
};

async function fetchBC(term: string): Promise<VetResult[]> {
    const url = `https://www.cvbc.ca/registrant-lookup-results/?lastname=&firstname=${encodeURIComponent(term)}&preferredname=&specialty=`;

    const res = await fetch(url, {
        headers: {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "referer": "https://www.cvbc.ca/online-registry/",
            "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Microsoft Edge\";v=\"140\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0"
        }
    });

    if (!res.ok) {
        console.error(`❌ Failed for term "${term}" — status ${res.status}`);
        return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const results: VetResult[] = [];

    $("table tbody tr").each((_, row) => {
        const cells = $(row).find("td").map((_, td) => $(td).text().trim()).get();
        const link = $(row).find("td.fullname a").attr("href") || "";
        const idMatch = link.match(/id=([0-9a-f-]+)/i);
        const id = idMatch ? idMatch[1] : "";

        if (cells.length >= 7) {
            // Split "Last, First" into separate fields
            let lastName = "";
            let firstName = "";
            if (cells[0].includes(",")) {
                const parts = cells[0].split(",").map(p => p.trim());
                lastName = parts[0] || "";
                firstName = parts[1] || "";
            } else {
                // Fallback if no comma
                const parts = cells[0].split(" ").map(p => p.trim());
                firstName = parts[0] || "";
                lastName = parts.slice(1).join(" ") || "";
            }
            results.push({
                id,
                name: `${firstName} ${lastName}`.trim(),
                firstName,
                lastName,
                preferredName: cells[1],
                class: cells[2],
                licenseStatus: cells[3],
                licenseType: cells[4],
                specialty: cells[5],
                notes: cells[6],
                licenseNumber: "" // placeholder for future objectives
            });
        }
    });

    return results;
}

(async () => {
    fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });

    let fileData: BCFileFormat = { progressPercent: 0, results: [] };
    if (fs.existsSync(OUT_JSON)) {
        try {
            fileData = JSON.parse(fs.readFileSync(OUT_JSON, "utf-8"));
            console.log(`♻️ Resuming from ${fileData.progressPercent.toFixed(3)}%`);
        } catch {
            console.warn("⚠️ Existing file unreadable, starting fresh");
        }
    }

    const masterList: VetResult[] = [...fileData.results];
    const totalTerms = letters.length * letters.length;

    // Build all terms
    const allTerms: string[] = [];
    for (const l1 of letters) {
        for (const l2 of letters) {
            allTerms.push(`${l1}${l2}`);
        }
    }

    // Calculate resume index
    const startIndex = Math.floor((fileData.progressPercent / 100) * totalTerms);
    const startTime = Date.now();

    for (let i = startIndex; i < totalTerms; i++) {
        const term = allTerms[i];
        console.log(`🔍 [${i + 1}/${totalTerms}] Fetching term: ${term}`);

        const batch = await fetchBC(term);
        console.log(`📄 ${term}: ${batch.length} results`);
        masterList.push(...batch);

        // ETA calculation
        const elapsedMs = Date.now() - startTime;
        const termsDoneThisRun = i - startIndex + 1;
        const avgMsPerTerm = elapsedMs / termsDoneThisRun;
        const remainingCount = totalTerms - (i + 1);
        const etaMs = avgMsPerTerm * remainingCount;
        console.log(`⏱ ETA: ~${(etaMs / 60000).toFixed(1)} minutes remaining`);

        // Flush every CHUNK_SIZE terms
        if ((i + 1) % CHUNK_SIZE === 0) {
            const unique = Array.from(new Map(masterList.map(v => [v.id, v])).values());
            const progressPercent = (((i + 1) / totalTerms) * 100);
            fs.writeFileSync(
                OUT_JSON,
                JSON.stringify({ progressPercent: parseFloat(progressPercent.toFixed(3)), results: unique }, null, 2),
                "utf-8"
            );
            console.log(`💾 Flushed ${unique.length} records at ${progressPercent.toFixed(3)}% — safe to commit now`);
        }

        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }

    const unique = Array.from(new Map(masterList.map(v => [v.id, v])).values());
    fs.writeFileSync(
        OUT_JSON,
        JSON.stringify({ progressPercent: 100.0, results: unique }, null, 2),
        "utf-8"
    );
    console.log(`✅ Done! Saved ${unique.length} vets to ${OUT_JSON}`);
    const publicPath = path.resolve(process.cwd(), "app/api/verify/britishcolumbia/britishcolumbiaVets-FINAL.json");
    fs.mkdirSync(path.dirname(publicPath), { recursive: true });
    fs.writeFileSync(publicPath, JSON.stringify(unique, null, 2), "utf-8");
    console.log(`📤 Exported clean results to ${publicPath}`);

})();
