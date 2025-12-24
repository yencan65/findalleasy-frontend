/**
 * Frontend structure sanity check (non-destructive)
 * ESM-safe (package.json has "type": "module")
 */
import fs from "node:fs";

const mustHave = [
  "index.html",
  "src/main.jsx",
  "src/App.jsx",
  "src/components/SearchBar.jsx",
  "src/components/Vitrin.jsx",
  "src/utils/searchBridge.js",
  "src/utils/api.js",
];

let ok = true;
for (const f of mustHave) {
  if (!fs.existsSync(f)) {
    console.log("❌ missing:", f);
    ok = false;
  } else {
    console.log("✅ ok:", f);
  }
}

const envExample = ".env.example";
if (!fs.existsSync(envExample)) {
  console.log("⚠️ missing .env.example (recommended)");
} else {
  console.log("✅ ok:", envExample);
}

process.exit(ok ? 0 : 1);
