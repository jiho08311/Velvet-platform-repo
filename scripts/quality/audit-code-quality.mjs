#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, "src")
const OUT_DIR = path.join(ROOT, "docs", "quality")
const JSON_OUT = path.join(OUT_DIR, "code-quality-report.json")
const MD_OUT = path.join(OUT_DIR, "code-quality-report.md")

const MODULE_LAYERS = new Set([
  "capabilities",
  "contracts",
  "events",
  "mappers",
  "policies",
  "projections",
  "public",
  "read-models",
  "rebuild",
  "repositories",
  "runtime",
  "services",
  "traceability",
  "ui",
  "use-cases",
  "validation",
  "verification",
  "workers",
])

const INTERNAL_LAYERS = new Set([
  "capabilities",
  "mappers",
  "policies",
  "projections",
  "read-models",
  "rebuild",
  "repositories",
  "runtime",
  "services",
  "traceability",
  "ui",
  "use-cases",
  "validation",
  "verification",
  "workers",
])

const PUBLIC_LAYERS = new Set(["public", "contracts"])

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      item.name === "node_modules" ||
      item.name === ".next" ||
      item.name === "dist" ||
      item.name === ".git"
    ) {
      continue
    }

    const full = path.join(dir, item.name)
    if (item.isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(item.name)) out.push(full)
  }

  return out
}

function rel(file) {
  return path.relative(ROOT, file)
}

function read(file) {
  return fs.readFileSync(file, "utf8")
}

function getImports(source) {
  const imports = []
  const patterns = [
    /import\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g,
    /export\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /require\s*\(\s*["']([^"']+)["']\s*\)/g,
  ]

  for (const re of patterns) {
    let match
    while ((match = re.exec(source))) imports.push(match[1])
  }

  return imports
}

function fileZone(file) {
  const parts = rel(file).split(path.sep)

  if (parts[0] === "src" && parts[1] === "modules" && parts[2]) {
    const rest = parts.slice(3)
    const layer = rest.find((part) => MODULE_LAYERS.has(part)) ?? "unknown"
    return {
      zone: "module",
      module: parts[2],
      layer,
    }
  }

  if (parts[0] === "src" && parts[1] === "app") {
    return {
      zone: "app",
      module: "app",
      layer: parts[2] === "api" ? "api" : "page",
    }
  }

  if (parts[0] === "src" && parts[1] === "workflows") {
    return {
      zone: "workflow",
      module: "workflow",
      layer: "workflow",
    }
  }

  if (parts[0] === "src" && parts[1] === "infrastructure") {
    return {
      zone: "infrastructure",
      module: "infrastructure",
      layer: parts[2] ?? "unknown",
    }
  }

  if (parts[0] === "src" && parts[1] === "shared") {
    return {
      zone: "shared",
      module: "shared",
      layer: parts[2] ?? "unknown",
    }
  }

  return {
    zone: "other",
    module: parts[1] ?? "unknown",
    layer: "unknown",
  }
}

function targetModuleInfo(spec) {
  if (!spec.startsWith("@/modules/")) return null
  const parts = spec.slice(2).split("/")
  const modulesIdx = parts.indexOf("modules")
  const moduleName = parts[modulesIdx + 1]
  const rest = parts.slice(modulesIdx + 2)
  const layer = rest.find((part) => MODULE_LAYERS.has(part)) ?? "unknown"
  return {
    module: moduleName,
    layer,
  }
}

function countMatches(source, regex) {
  return [...source.matchAll(regex)].length
}

function uniqueCount(values) {
  return new Set(values).size
}

function firstLineNumber(source, needle) {
  const idx = source.indexOf(needle)
  if (idx < 0) return null
  return source.slice(0, idx).split(/\r?\n/).length
}

function isTestFile(file) {
  return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(file)
}

function hasRouteHandler(file) {
  return /src\/app\/api\/.+\/route\.ts$/.test(rel(file))
}

function routeHasAuthGuard(source) {
  return /require(Session|User|Active|Admin|SuperAdmin|CronSecret|InternalJobSecret)|assertPassVerified|getCurrentUser|getSession|readSession|routeAccess\s*=\s*["'](public|disabled)["']/.test(
    source
  )
}

function hasPublicContractMarker(source) {
  return (
    /export\s+const\s+PUBLIC_CONTRACT\s*=\s*true/.test(source) ||
    /\/\/\s*PUBLIC_CONTRACT\b/.test(source)
  )
}

function riskScore({
  boundaryCount,
  directDbOutsideRepos,
  appRuntimeImports,
  crossRepoImports,
  routeAuthMissing,
  giantFiles,
  anyCount,
  testFiles,
}) {
  let value = 100
  value -= Math.min(20, boundaryCount * 0.8)
  value -= Math.min(15, directDbOutsideRepos * 0.7)
  value -= Math.min(15, appRuntimeImports * 0.8)
  value -= Math.min(15, crossRepoImports * 1.2)
  value -= Math.min(10, routeAuthMissing * 0.7)
  value -= Math.min(10, giantFiles * 1.2)
  value -= Math.min(8, anyCount * 0.05)
  if (testFiles < 25) value -= 7
  return Math.max(0, Math.round(value))
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function categoryScores(summary) {
  const architecture = clampScore(
    92 -
      summary.appRuntimeFindings * 0.7 -
      summary.crossRepoFindings * 0.9 -
      summary.boundaryFindings * 0.08
  )

  const dbLayer = clampScore(
    82 -
      summary.directDbFindings * 0.7 -
      summary.crossRepoFindings * 0.55
  )

  const maintainability = clampScore(
    86 -
      summary.largeFiles * 0.6 -
      summary.highImportFiles * 0.8 -
      summary.totalAny * 0.12 -
      summary.totalConsole * 0.03
  )

  const testing = clampScore(35 + Math.min(35, summary.testFiles * 1.3))

  const securityReadiness = clampScore(
    76 -
      summary.routeAuthFindings * 0.35 -
      summary.directDbFindings * 0.2 -
      summary.crossRepoFindings * 0.15
  )

  const msaReadiness = clampScore(
    84 -
      summary.crossRepoFindings * 1.1 -
      summary.appRuntimeFindings * 0.65 -
      summary.boundaryFindings * 0.06
  )

  const operationsReadiness = clampScore(
    58 +
      Math.min(8, summary.testFiles * 0.15) -
      summary.directDbFindings * 0.08
  )

  const overall = clampScore(
    architecture * 0.2 +
      dbLayer * 0.18 +
      maintainability * 0.18 +
      testing * 0.14 +
      securityReadiness * 0.12 +
      msaReadiness * 0.12 +
      operationsReadiness * 0.06
  )

  return {
    overall,
    architecture,
    dbLayer,
    maintainability,
    testing,
    securityReadiness,
    msaReadiness,
    operationsReadiness,
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const files = walk(SRC_DIR)
const codeFiles = files.filter((file) => !isTestFile(file))
const testFiles = files.filter(isTestFile)

const fileMetrics = []
const boundaryFindings = []
const directDbFindings = []
const appRuntimeFindings = []
const crossRepoFindings = []
const routeAuthFindings = []
const publicInternalFindings = []

let totalLoc = 0
let totalImports = 0
let totalAny = 0
let totalTodo = 0
let totalConsole = 0

for (const file of files) {
  const source = read(file)
  const zone = fileZone(file)
  const lines = source.split(/\r?\n/)
  const imports = getImports(source)
  const importModules = imports.map(targetModuleInfo).filter(Boolean)
  const loc = lines.filter((line) => line.trim().length > 0).length
  const anyCount = countMatches(source, /\bany\b/g)
  const todoCount = countMatches(source, /\b(TODO|FIXME|HACK)\b/g)
  const consoleCount = countMatches(source, /\bconsole\.(log|warn|error|info|debug)\b/g)
  const tryCount = countMatches(source, /\btry\s*\{/g)
  const catchCount = countMatches(source, /\bcatch\s*(?:\([^)]*\))?\s*\{/g)

  totalLoc += loc
  totalImports += imports.length
  totalAny += anyCount
  totalTodo += todoCount
  totalConsole += consoleCount

  fileMetrics.push({
    file: rel(file),
    zone,
    loc,
    imports: imports.length,
    importedModuleCount: uniqueCount(importModules.map((item) => item.module)),
    anyCount,
    todoCount,
    consoleCount,
    tryCount,
    catchCount,
  })

  for (const spec of imports) {
    const target = targetModuleInfo(spec)
    if (!target) continue

    const sameModule = zone.zone === "module" && zone.module === target.module
    const allowed = PUBLIC_LAYERS.has(target.layer)

    if ((zone.zone === "app" || zone.zone === "workflow") && target.layer === "runtime") {
      appRuntimeFindings.push({
        file: rel(file),
        import: spec,
        target: `${target.module}/${target.layer}`,
        line: firstLineNumber(source, spec),
      })
    }

    if (!sameModule && target.layer === "repositories") {
      crossRepoFindings.push({
        file: rel(file),
        source: `${zone.module}/${zone.layer}`,
        import: spec,
        target: `${target.module}/${target.layer}`,
        line: firstLineNumber(source, spec),
      })
    }

    if (
      zone.zone === "module" &&
      zone.layer === "public" &&
      INTERNAL_LAYERS.has(target.layer) &&
      !hasPublicContractMarker(source)
    ) {
      publicInternalFindings.push({
        file: rel(file),
        import: spec,
        target: `${target.module}/${target.layer}`,
        line: firstLineNumber(source, spec),
      })
    }

    if (
      (zone.zone === "app" || zone.zone === "workflow" || !sameModule) &&
      !allowed &&
      target.layer !== "unknown"
    ) {
      boundaryFindings.push({
        file: rel(file),
        source: `${zone.module}/${zone.layer}`,
        import: spec,
        target: `${target.module}/${target.layer}`,
        line: firstLineNumber(source, spec),
      })
    }
  }

  const dbSignals = [
    ...source.matchAll(
      /\b(supabaseAdmin|createSupabaseServerClient|createServerSupabaseClient|createClient)\b/g
    ),
    ...source.matchAll(/\.(from|rpc)\(\s*["'][^"']+["']/g),
  ]

  const isAllowedDbZone =
    zone.zone === "infrastructure" ||
    (zone.zone === "module" && zone.layer === "repositories") ||
    (zone.zone === "module" && zone.layer === "traceability") ||
    (zone.zone === "module" && zone.layer === "rebuild") ||
    (zone.zone === "module" && zone.layer === "projections")

  if (!isAllowedDbZone && dbSignals.length > 0) {
    directDbFindings.push({
      file: rel(file),
      zone: `${zone.module}/${zone.layer}`,
      signalCount: dbSignals.length,
    })
  }

  if (hasRouteHandler(file) && !routeHasAuthGuard(source)) {
    routeAuthFindings.push({
      file: rel(file),
    })
  }
}

const largeFiles = fileMetrics
  .filter((item) => item.loc >= 300)
  .sort((a, b) => b.loc - a.loc)

const highImportFiles = fileMetrics
  .filter((item) => item.imports >= 20 || item.importedModuleCount >= 5)
  .sort((a, b) => b.imports - a.imports)

const anyHotspots = fileMetrics
  .filter((item) => item.anyCount > 0)
  .sort((a, b) => b.anyCount - a.anyCount)

const consoleHotspots = fileMetrics
  .filter((item) => item.consoleCount > 0)
  .sort((a, b) => b.consoleCount - a.consoleCount)

const strictHardeningScore = riskScore({
  boundaryCount: boundaryFindings.length,
  directDbOutsideRepos: directDbFindings.length,
  appRuntimeImports: appRuntimeFindings.length,
  crossRepoImports: crossRepoFindings.length,
  routeAuthMissing: routeAuthFindings.length,
  giantFiles: largeFiles.length,
  anyCount: totalAny,
  testFiles: testFiles.length,
})

const report = {
  generatedAt: new Date().toISOString(),
  score: null,
  strictHardeningScore,
  summary: {
    filesScanned: files.length,
    codeFiles: codeFiles.length,
    testFiles: testFiles.length,
    totalLoc,
    totalImports,
    totalAny,
    totalTodo,
    totalConsole,
    largeFiles: largeFiles.length,
    highImportFiles: highImportFiles.length,
    boundaryFindings: boundaryFindings.length,
    appRuntimeFindings: appRuntimeFindings.length,
    crossRepoFindings: crossRepoFindings.length,
    publicInternalFindings: publicInternalFindings.length,
    directDbFindings: directDbFindings.length,
    routeAuthFindings: routeAuthFindings.length,
  },
  findings: {
    boundaryFindings,
    appRuntimeFindings,
    crossRepoFindings,
    publicInternalFindings,
    directDbFindings,
    routeAuthFindings,
    largeFiles: largeFiles.slice(0, 50),
    highImportFiles: highImportFiles.slice(0, 50),
    anyHotspots: anyHotspots.slice(0, 50),
    consoleHotspots: consoleHotspots.slice(0, 50),
  },
}

report.score = categoryScores(report.summary)

function mdTable(rows, headers) {
  if (rows.length === 0) return "_None found._\n"
  const header = `| ${headers.join(" | ")} |`
  const sep = `| ${headers.map(() => "---").join(" | ")} |`
  const body = rows
    .map((row) => `| ${headers.map((headerName) => row[headerName] ?? "").join(" | ")} |`)
    .join("\n")
  return `${header}\n${sep}\n${body}\n`
}

const md = []
md.push("# Velvet Code Quality Report")
md.push("")
md.push(`Generated at: ${report.generatedAt}`)
md.push("")
md.push(`Overall score: **${report.score.overall}/100**`)
md.push("")
md.push(
  `Strict hardening debt score: **${strictHardeningScore}/100**. This stricter score treats every boundary and DB-access finding as launch-hardening debt, so it is intentionally harsher than the overall quality score.`
)
md.push("")
md.push("## Category Scores")
md.push("")
md.push(
  mdTable(
    Object.entries(report.score).map(([category, value]) => ({ category, value })),
    ["category", "value"]
  )
)
md.push("")
md.push("## Summary")
md.push("")
md.push(
  mdTable(
    Object.entries(report.summary).map(([metric, value]) => ({ metric, value })),
    ["metric", "value"]
  )
)
md.push("")
md.push("## Highest Priority Findings")
md.push("")
md.push(
  [
    `1. App/workflow -> module runtime imports: ${appRuntimeFindings.length}`,
    `2. Cross-module repository imports: ${crossRepoFindings.length}`,
    `3. Direct DB access outside approved DB layers: ${directDbFindings.length}`,
    `4. API routes without obvious auth guard: ${routeAuthFindings.length}`,
    `5. Large files over 300 LOC: ${largeFiles.length}`,
  ].join("\n")
)
md.push("")
md.push("## App/Workflow Runtime Imports")
md.push("")
md.push(
  mdTable(
    appRuntimeFindings.slice(0, 40).map((item) => ({
      file: item.file,
      line: item.line ?? "",
      target: item.target,
      import: item.import,
    })),
    ["file", "line", "target", "import"]
  )
)
md.push("")
md.push("## Cross-Module Repository Imports")
md.push("")
md.push(
  mdTable(
    crossRepoFindings.slice(0, 50).map((item) => ({
      file: item.file,
      line: item.line ?? "",
      source: item.source,
      target: item.target,
      import: item.import,
    })),
    ["file", "line", "source", "target", "import"]
  )
)
md.push("")
md.push("## Direct DB Access Outside Approved Layers")
md.push("")
md.push(
  mdTable(
    directDbFindings.slice(0, 50).map((item) => ({
      file: item.file,
      zone: item.zone,
      signalCount: item.signalCount,
    })),
    ["file", "zone", "signalCount"]
  )
)
md.push("")
md.push("## API Routes Without Obvious Auth Guard")
md.push("")
md.push(
  mdTable(
    routeAuthFindings.slice(0, 80).map((item) => ({ file: item.file })),
    ["file"]
  )
)
md.push("")
md.push("## Large Files")
md.push("")
md.push(
  mdTable(
    largeFiles.slice(0, 40).map((item) => ({
      file: item.file,
      loc: item.loc,
      imports: item.imports,
      anyCount: item.anyCount,
    })),
    ["file", "loc", "imports", "anyCount"]
  )
)
md.push("")
md.push("## High Import Files")
md.push("")
md.push(
  mdTable(
    highImportFiles.slice(0, 40).map((item) => ({
      file: item.file,
      imports: item.imports,
      importedModuleCount: item.importedModuleCount,
      loc: item.loc,
    })),
    ["file", "imports", "importedModuleCount", "loc"]
  )
)
md.push("")
md.push("## Any Usage Hotspots")
md.push("")
md.push(
  mdTable(
    anyHotspots.slice(0, 40).map((item) => ({
      file: item.file,
      anyCount: item.anyCount,
      loc: item.loc,
    })),
    ["file", "anyCount", "loc"]
  )
)
md.push("")
md.push("## Notes")
md.push("")
md.push(
  [
    "- This report is a static analysis aid, not a full correctness proof.",
    "- Route auth findings are heuristic. Public routes may be expected, and some protected routes may use indirect guards.",
    "- Direct DB access findings are intentionally strict to highlight places that may need repository extraction.",
    "- Cross-module repository findings are the strongest MSA-readiness blockers.",
  ].join("\n")
)

fs.writeFileSync(JSON_OUT, JSON.stringify(report, null, 2) + "\n")
fs.writeFileSync(MD_OUT, md.join("\n") + "\n")

console.log(
  JSON.stringify(
    {
      score: report.score,
      strictHardeningScore,
      summary: report.summary,
      outputs: {
        json: path.relative(ROOT, JSON_OUT),
        markdown: path.relative(ROOT, MD_OUT),
      },
    },
    null,
    2
  )
)
