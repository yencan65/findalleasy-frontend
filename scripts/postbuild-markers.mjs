import { writeFileSync, readFileSync, existsSync } from "node:fs";

const sha =
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.COMMIT_SHA ||
  "dev";

const short = String(sha).trim().slice(0, 7);

// 1) deploy-id.txt her deploy’da dist’e yaz
try {
  writeFileSync("dist/deploy-id.txt", short + "\n", "utf8");
} catch {}

// 2) dist/_headers içindeki X-FA-Deploy satırını build çıktısında güncelle
try {
  const p = "dist/_headers";
  if (existsSync(p)) {
    let h = readFileSync(p, "utf8");
    if (/X-FA-Deploy:/i.test(h)) {
      h = h.replace(/X-FA-Deploy:\s*\S+/gi, `X-FA-Deploy: ${short}`);
    } else {
      h = h.replace(/\/\*\s*\n/, m => m + `  X-FA-Deploy: ${short}\n`);
    }
    writeFileSync(p, h, "utf8");
  }
} catch {}

console.log(`[postbuild] deploy markers => ${short}`);
