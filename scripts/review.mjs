// Headless email review. Usage: node <plugin>/scripts/review.mjs <campaign-folder>
// Run it from the business repo root. It reads:
//   brand/voice.md, .claude/rules/emails.md   (the business's own voice and rules)
//   review/criteria.md                        (what counts as high severity for this business)
// It saves review/findings.json in the business repo and exits:
//   0 = no high-severity findings, 1 = at least one high, 2 = the run itself failed.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = process.cwd();
const folder = process.argv[2];
if (!folder) {
  console.error("Usage: node <plugin>/scripts/review.mjs <campaign-folder>");
  process.exit(2);
}

const criteriaPath = join(repo, "review", "criteria.md");
if (!existsSync(criteriaPath)) {
  console.error(
    "Missing review/criteria.md in this repo. Create it and list what this business treats as " +
      "high severity (for example: guarantees, legal advice, fake urgency, missing unsubscribe link).",
  );
  process.exit(2);
}
const criteria = readFileSync(criteriaPath, "utf8").trim();

const schemaText = JSON.stringify(
  JSON.parse(readFileSync(join(pluginRoot, "review", "findings.schema.json"), "utf8")),
);

const prompt =
  `Review every email in ${folder} against brand/voice.md and .claude/rules/emails.md. ` +
  `Treat the following as high severity:\n${criteria}\n` +
  `Report only real problems.`;

// On Windows the npm shim is claude.cmd, which mangles quotes in arguments.
// Call the real claude.exe next to it so the JSON schema reaches Claude intact.
function claudeCommand() {
  if (process.platform === "win32") {
    const found = spawnSync("where", ["claude"], { encoding: "utf8" });
    for (const p of (found.stdout || "").split(/\r?\n/).filter(Boolean)) {
      const exe = join(dirname(p), "node_modules", "@anthropic-ai", "claude-code", "bin", "claude.exe");
      if (existsSync(exe)) return exe;
    }
  }
  return "claude";
}

const run = spawnSync(
  claudeCommand(),
  [
    "-p", prompt,
    "--output-format", "json",
    "--json-schema", schemaText,
    "--allowedTools", "Read,Glob,Grep",
  ],
  { cwd: repo, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);

if (run.error || run.status !== 0) {
  let reason = run.error?.message || run.stderr;
  try {
    const o = JSON.parse(run.stdout);
    const last = Array.isArray(o) ? o[o.length - 1] : o;
    if (last?.is_error && last.result) reason = last.result;
  } catch {}
  console.error("Claude run failed:", reason || run.stdout);
  process.exit(2);
}

let out;
try {
  out = JSON.parse(run.stdout);
} catch {
  console.error("Could not parse Claude output as JSON:\n" + run.stdout.slice(0, 500));
  process.exit(2);
}

// Output may be one object, or a list whose last item is the result.
const result = Array.isArray(out) ? out[out.length - 1] : out;
const structured = result?.structured_output;
if (!structured || !Array.isArray(structured.findings)) {
  console.error("No structured_output in result:\n" + JSON.stringify(result, null, 2).slice(0, 800));
  process.exit(2);
}

mkdirSync(join(repo, "review"), { recursive: true });
writeFileSync(join(repo, "review", "findings.json"), JSON.stringify(structured, null, 2) + "\n");

const counts = { high: 0, medium: 0, low: 0 };
for (const f of structured.findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;
console.log(
  `${folder}: ${structured.findings.length} findings (${counts.high} high, ${counts.medium} medium, ${counts.low} low)`,
);
process.exit(counts.high > 0 ? 1 : 0);
