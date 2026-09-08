import { readFileSync } from "node:fs";

const source = JSON.parse(readFileSync(new URL("../src/i18n/en.json", import.meta.url), "utf8"));
const completeResources = ["hi", "mr"];
// These keys are intentionally supplied by deadlineUi in regional.ts for every locale.
const regionalKeys = new Set(["submissionDate", "applicationDeadline"]);
let failed = false;

for (const locale of completeResources) {
  const dictionary = JSON.parse(readFileSync(new URL(`../src/i18n/${locale}.json`, import.meta.url), "utf8"));
  const missing = Object.keys(source).filter((key) => !(key in dictionary) && !regionalKeys.has(key));
  const extra = Object.keys(dictionary).filter((key) => !(key in source));
  const placeholderMismatches = Object.keys(source).filter((key) => {
    if (!(key in dictionary)) return false;
    const placeholders = (value) => [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort().join(",");
    return placeholders(source[key]) !== placeholders(dictionary[key]);
  });
  if (missing.length || extra.length || placeholderMismatches.length) {
    failed = true;
    console.error(`${locale}: ${missing.length} missing, ${extra.length} extra`);
    if (missing.length) console.error(`  missing: ${missing.join(", ")}`);
    if (extra.length) console.error(`  extra: ${extra.join(", ")}`);
    if (placeholderMismatches.length) console.error(`  placeholder mismatch: ${placeholderMismatches.join(", ")}`);
  } else {
    console.log(`${locale}: ${Object.keys(dictionary).length} keys complete`);
  }
}

const registry = readFileSync(new URL("../src/i18n/languages.ts", import.meta.url), "utf8");
if (!registry.includes('["mr", "Marathi", "मराठी"]')) {
  failed = true;
  console.error("mr: missing from the supported language registry");
}

if (failed) process.exitCode = 1;
