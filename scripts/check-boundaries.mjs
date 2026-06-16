import { spawnSync } from "child_process";
import fs from "fs";

const baselinePath = "boundary/violation-baseline.json";
const auditPath = "audit-cross-module-runtime-dependencies.json";

if (!fs.existsSync(baselinePath)) {
  console.error(`Missing baseline: ${baselinePath}`);
  process.exit(1);
}

const audit = spawnSync("node", ["scripts/audit-cross-module-runtime-dependencies.mjs"], {
  stdio: "inherit",
});

if (audit.status !== 0) {
  process.exit(audit.status ?? 1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const auditResult = JSON.parse(fs.readFileSync(auditPath, "utf8"));

const allowed = new Set(
  (baseline.allowedViolations ?? []).map(v =>
    `${v.fromFile}::${v.toImport}::${v.severity}`
  )
);

const currentViolations = auditResult.violations ?? [];

const newViolations = currentViolations.filter(v => {
  const key = `${v.fromFile}::${v.toImport}::${v.severity}`;
  return !allowed.has(key);
});

console.log("");
console.log("Boundary check summary");
console.log("----------------------");
console.log(`Current violations: ${currentViolations.length}`);
console.log(`Baseline violations: ${allowed.size}`);
console.log(`New violations: ${newViolations.length}`);

if (newViolations.length > 0) {
  console.error("");
  console.error("New cross-module boundary violations detected:");
  for (const v of newViolations.slice(0, 50)) {
    console.error(
      `- [${v.severity}] ${v.fromFile} -> ${v.toImport} (${v.reason})`
    );
  }

  if (newViolations.length > 50) {
    console.error(`...and ${newViolations.length - 50} more`);
  }

  process.exit(1);
}

console.log("No new cross-module boundary violations.");
process.exit(0);