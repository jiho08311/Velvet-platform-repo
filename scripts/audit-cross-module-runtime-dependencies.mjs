#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const OUT_FILE = path.join(ROOT, "audit-cross-module-runtime-dependencies.json");

const MODULE_PARTS = new Set([
  "runtime",
  "repositories",
  "services",
  "policies",

  
  "mappers",
  "ui",
  "traceability",
  "public",
  "contracts",
]);

const HIGH_PARTS = new Set([
  "runtime",
  "repositories",
  "services",
  "policies",
  "mappers",
  "ui",
  "traceability",
]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === "node_modules" || item.name === ".next" || item.name === "dist") continue;

    const full = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|js|jsx|mts|cts)$/.test(item.name)) out.push(full);
  }
  return out;
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function getImports(source) {
  const imports = [];

  const patterns = [
    /import\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g,
    /export\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /require\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const re of patterns) {
    let match;
    while ((match = re.exec(source))) imports.push(match[1]);
  }

  return imports;
}

function normalizeImport(fromFile, spec) {
  if (spec.startsWith("@/")) {
    return path.join(ROOT, spec.slice(2));
  }

  if (spec.startsWith("src/")) {
    return path.join(ROOT, spec);
  }

  if (spec.startsWith("./") || spec.startsWith("../")) {
    return path.resolve(path.dirname(fromFile), spec);
  }

  return null;
}

function splitPath(file) {
  return path.relative(SRC_DIR, file).split(path.sep);
}

function moduleInfo(file) {
  const parts = splitPath(file);

  const modulesIdx = parts.indexOf("modules");
  if (modulesIdx === -1 || !parts[modulesIdx + 1]) return null;

  const module = parts[modulesIdx + 1];
  const rest = parts.slice(modulesIdx + 2);
  const layer = rest.find((p) => MODULE_PARTS.has(p)) ?? "unknown";

  return { module, layer };
}

function importedModuleInfo(fromFile, spec) {
  const resolved = normalizeImport(fromFile, spec);
  if (!resolved) return null;

  const rel = path.relative(SRC_DIR, resolved);
  if (rel.startsWith("..")) return null;

  const parts = rel.split(path.sep);
  const modulesIdx = parts.indexOf("modules");
  if (modulesIdx === -1 || !parts[modulesIdx + 1]) return null;

  const module = parts[modulesIdx + 1];
  const rest = parts.slice(modulesIdx + 2);
  const layer = rest.find((p) => MODULE_PARTS.has(p)) ?? "unknown";

  return { module, layer, resolved };
}

function isAllowedCrossModuleImport(targetLayer) {
  return targetLayer === "public" || targetLayer === "contracts";
}

function severity(sourceLayer, targetLayer) {
  if (HIGH_PARTS.has(targetLayer)) return "HIGH";
  if (sourceLayer === "repositories" && targetLayer === "repositories") return "HIGH";
  if (sourceLayer === "services" && targetLayer === "repositories") return "HIGH";
  if (sourceLayer === "runtime" && ["repositories", "services"].includes(targetLayer)) return "HIGH";
  if (sourceLayer === "ui" && targetLayer === "repositories") return "HIGH";
  return "MEDIUM";
}

const files = walk(SRC_DIR);

const matrix = {};
const violations = [];
let totalImports = 0;

for (const file of files) {
  const source = read(file);
  const from = moduleInfo(file);
  if (!from) continue;

  const imports = getImports(source);

  for (const spec of imports) {
    totalImports += 1;

    const target = importedModuleInfo(file, spec);
    if (!target) continue;
    if (from.module === target.module) continue;

    matrix[from.module] ??= {};
    matrix[from.module][target.module] ??= {
      total: 0,
      allowed: 0,
      violations: 0,
      high: 0,
      targets: {},
    };

    matrix[from.module][target.module].total += 1;
    matrix[from.module][target.module].targets[target.layer] =
      (matrix[from.module][target.module].targets[target.layer] ?? 0) + 1;

    const allowed = isAllowedCrossModuleImport(target.layer);

    if (allowed) {
      matrix[from.module][target.module].allowed += 1;
      continue;
    }

    const sev = severity(from.layer, target.layer);

    matrix[from.module][target.module].violations += 1;
    if (sev === "HIGH") matrix[from.module][target.module].high += 1;

    violations.push({
      severity: sev,
      sourceModule: from.module,
      sourceLayer: from.layer,
      targetModule: target.module,
      targetLayer: target.layer,
      fromFile: path.relative(ROOT, file),
      import: spec,
      rule: "cross-module-internal-import",
      message: `Module ${from.module}/${from.layer} imports ${target.module}/${target.layer} outside public/contracts`,
    });
  }
}

const highViolations = violations.filter((v) => v.severity === "HIGH");

const extractionBlockers = highViolations.map((v) => ({
  sourceModule: v.sourceModule,
  targetModule: v.targetModule,
  sourceLayer: v.sourceLayer,
  targetLayer: v.targetLayer,
  fromFile: v.fromFile,
  import: v.import,
  reason: "HIGH cross-module runtime/internal dependency blocks independent extraction",
}));

const modules = [...new Set(files.map(moduleInfo).filter(Boolean).map((m) => m.module))].sort();

const result = {
  generatedAt: new Date().toISOString(),
  scope: {
    phase: "Phase 10 - MSA Extraction Rehearsal",
    scannedRoot: "src",
    allowedCrossModuleTargets: ["public", "contracts"],
    checkedLayers: [...MODULE_PARTS].sort(),
  },
  summary: {
    totalFilesScanned: files.length,
    totalImports,
    totalViolations: violations.length,
    highViolations: highViolations.length,
    extractionBlockers: extractionBlockers.length,
    modules,
  },
  matrix,
  violations,
  highViolations,
  extractionBlockers,
};

fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2) + "\n");

console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}`);
console.log(JSON.stringify(result.summary, null, 2));
