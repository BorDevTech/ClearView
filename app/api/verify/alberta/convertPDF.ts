#!/usr/bin/env ts-node
/**
 * scripts/scrapeAllPagesNoClinic.ts
 *
 * - Pulls all pages of ABVMA roster (50 vets/page) in CHUNK_SIZE blocks
 * - Skips “Suspended” cards
 * - Drops the CLINIC field entirely
 * - Logs per-page and per-chunk progress
 * - Emits CSV: LAST_NAME, FIRST_NAME, TYPE, LICENSE
 */

import fs from "fs";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import Papa from "papaparse";

const BASE_URL =
  "https://abvma.in1touch.org/client/roster/clientRosterView.html?clientRosterId=168";
const OUT_CSV = path.resolve(
  process.cwd(),
  "app/api/verify/alberta/all_active_vets_no_clinic.csv"
);

// number of pages to process before flushing to CSV
const CHUNK_SIZE = 5;

async function fetchPageHtml(pageIndex: number): Promise<string> {
  const url = `${BASE_URL}&page=${pageIndex + 1}`;
  return (await axios.get(url)).data as string;
}

(async () => {
  // 1) Fetch page 1 to discover total pages
  const firstHtml = await fetchPageHtml(0);
  const $first = cheerio.load(firstHtml);
  const banner = $first("*")
    .filter((_, el) => $first(el).text().includes("Profiles found"))
    .first()
    .text();
  const totalMatch = banner.match(/([\d,]+)\s+Profiles found/);
  if (!totalMatch) {
    console.error("❌ Could not parse total from banner:", banner);
    process.exit(1);
  }
  const total = parseInt(totalMatch[1].replace(/,/g, ""), 10);
  const pages = Math.ceil(total / 50);
  console.log(`ℹ️  ${total} vets → ${pages} pages`);

  // 2) Write CSV header (no CLINIC)
  fs.mkdirSync(path.dirname(OUT_CSV), { recursive: true });
  fs.writeFileSync(
    OUT_CSV,
    Papa.unparse([["LAST_NAME", "FIRST_NAME", "TYPE", "LICENSE"]]) + "\n"
  );

  let totalRows = 0;

  // 3) Process in chunks of CHUNK_SIZE pages
  for (let chunkStart = 0; chunkStart < pages; chunkStart += CHUNK_SIZE) {
    const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, pages);
    const rowsThisChunk: string[][] = [];

    for (let p = chunkStart; p < chunkEnd; p++) {
      console.log(`📄 Scraping page ${p + 1}/${pages}…`);
      const html = p === 0 ? firstHtml : await fetchPageHtml(p);
      const $ = cheerio.load(html);

      $("#rosterRecords .col-md-4.roster_tbl").each((_, div) => {
        const inner = $(div).html() || "";

        // Skip suspended vets
        if (/<span[^>]*>\s*Suspended\s*<\/span>/i.test(inner)) {
          return;
        }

        // Extract last, first
        const nm = inner.match(/<strong[^>]*>\s*([^<]+?)\s*<\/strong>/);
        const [last = "", first = ""] = (nm?.[1] || "")
          .split(",")
          .map((s) => s.trim());

        // Extract TYPE (everything after </font> up to Reg. #)
        const tp = inner.match(/<\/font>([\s\S]*?)<br>\s*Reg\.\s*#/);
        const type = tp
          ? tp[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
          : "";

        // Extract LICENSE number
        const lic = inner.match(/Reg\.\s*#\s*:\s*(\d+)/);
        const license = (lic?.[1] || "").trim();

        rowsThisChunk.push([last, first, type, license]);
        totalRows++;
      });
    }

    // 4) Append this chunk to CSV and log
    const csvChunk = Papa.unparse(rowsThisChunk, { header: false });
    fs.appendFileSync(OUT_CSV, csvChunk + "\n");

    console.log(
      `✅ Completed pages ${chunkStart + 1}-${chunkEnd} ` +
      `(+${rowsThisChunk.length} records)`
    );
  }

  console.log(`🎉 Done! Wrote ${totalRows} active vets to ${OUT_CSV}`);
})().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
