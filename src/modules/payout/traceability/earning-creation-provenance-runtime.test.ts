import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523001400_wave_010_fel_br_014_earning_creation_provenance.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/settlement/earning-creation-provenance-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/settlement/canonical-earning-creation-provenance-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/settlement/feature-flags.ts"
)
const CREATE_EARNING_PATH = join(
  process.cwd(),
  "src/modules/payout/runtime/create-earning.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-014 introduces additive earning creation provenance topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_settlement_events/)
  assert.match(sql, /create table if not exists public\.canonical_earning_lineage/)
  assert.match(sql, /create table if not exists public\.canonical_earning_provenance/)
  assert.match(sql, /create table if not exists public\.canonical_earning_reconstruction_metadata/)
  assert.match(sql, /settlement_event_key text not null unique/)
  assert.match(sql, /earning_lineage_key text not null unique/)
  assert.match(sql, /earning_provenance_key text not null unique/)
  assert.match(sql, /earning_reconstruction_key text not null unique/)
  assert.match(sql, /reconstruction_confidence text not null default 'earning_runtime_observed'/)
})

test("FEL-BR-014 schema is additive, rollback-safe, and non-serving", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /earning_runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /authority_mode text not null default 'synchronized_candidate'/)
  assert.match(sql, /enforcement_mode text not null default 'none'/)
  assert.match(sql, /promotion_allowed boolean not null default false/)
  assert.match(sql, /rollback_safe boolean not null default true/)
  assert.match(sql, /fail_open boolean not null default true/)
  assert.match(sql, /immutable_ledger_promotion_allowed boolean not null default false/)
  assert.match(sql, /settlement_replay_repair_allowed boolean not null default false/)
  assert.match(sql, /payout_eligibility_replacement_allowed boolean not null default false/)
  assert.match(sql, /replay_mutation_allowed boolean not null default false/)
  assert.match(sql, /replay_owned_execution_allowed boolean not null default false/)
  assert.match(sql, /reconciliation_repair_allowed boolean not null default false/)
  assert.doesNotMatch(sql, /\bdrop column\b/i)
  assert.doesNotMatch(sql, /\bdrop table\b/i)
  assert.doesNotMatch(sql, /\bdelete from public\./i)
  assert.doesNotMatch(sql, /\btruncate table\b/i)
  assert.doesNotMatch(sql, /\brename column\b/i)
  assert.doesNotMatch(sql, /\brename to\b/i)
  assert.doesNotMatch(sql, /\balter table public\.earnings\b/i)
  assert.doesNotMatch(sql, /\balter table public\.payments\b/i)
  assert.doesNotMatch(sql, /\balter table public\.payout_requests\b/i)
  assert.doesNotMatch(sql, /\balter table public\.payouts\b/i)
})

test("FEL-BR-014 runtime is feature-gated, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const createEarning = read(CREATE_EARNING_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /WAVE_010_EARNING_CREATION_PROVENANCE_KILL_SWITCH/)
  assert.match(flags, /isWave010EarningCreationProvenanceEnabled/)
  assert.match(runtime, /isWave010EarningCreationProvenanceEnabled/)
  assert.match(runtime, /synchronizeEarningCreationProvenanceNoThrow/)
  assert.match(createEarning, /synchronizeEarningCreationProvenanceNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /writeCanonicalEarningCreationProvenanceNoThrow/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-014 preserves earning lifecycle and payout eligibility authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const createEarning = read(CREATE_EARNING_PATH)

  assert.match(createEarning, /insertEarningCreationRow/)
  assert.match(createEarning, /writeEarningCreatedShadowEvent/)
  assert.match(createEarning, /writePaymentToEarningShadowLineage/)
  assert.match(repository, /earningCreationRuntimeAuthorityPreserved: true/)
  assert.match(repository, /earningsMutableSettlementStatePreserved: true/)
  assert.match(repository, /immutableLedgerPromotionAllowed: false/)
  assert.match(repository, /settlementReplayRepairAllowed: false/)
  assert.match(repository, /payoutEligibilityReplacementAllowed: false/)
  assert.match(runtime, /immutableLedgerPromotionAllowed: false/)
  assert.match(runtime, /settlementReplayRepairAllowed: false/)
  assert.match(runtime, /payoutEligibilityReplacementAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("earnings"\)/)
  assert.doesNotMatch(runtime, /\.from\("payments"\)/)
  assert.doesNotMatch(runtime, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(runtime, /\.from\("payouts"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payments"\)/)
  assert.doesNotMatch(repository, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(repository, /\.from\("payouts"\)/)
})

test("FEL-BR-014 synchronizes only after runtime earning creation", () => {
  const createEarning = read(CREATE_EARNING_PATH)

  const insert = createEarning.indexOf("const data = await insertEarningCreationRow")
  const shadowEvent = createEarning.indexOf("await writeEarningCreatedShadowEvent")
  const shadowLineage = createEarning.indexOf("await writePaymentToEarningShadowLineage")
  const provenance = createEarning.indexOf("await synchronizeEarningCreationProvenanceNoThrow")
  const audit = createEarning.indexOf("await createAuditLog")

  assert.ok(insert > -1)
  assert.ok(shadowEvent > insert)
  assert.ok(shadowLineage > shadowEvent)
  assert.ok(provenance > shadowLineage)
  assert.ok(audit > provenance)
})

test("FEL-BR-014 exposes advisory blockers without repair or promotion authority", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /earning_lineage_drift_detected/)
  assert.match(runtime, /orphaned_earning_lineage_detected/)
  assert.match(runtime, /replay_safe_earning_reconstruction_gap_detected/)
  assert.match(runtime, /payment_to_earning_lineage_divergence_detected/)
  assert.match(runtime, /payout_eligibility_mismatch_detected/)
  assert.match(runtime, /settlement_replay_repair_detected/)
  assert.match(runtime, /projection_owned_balance_detected/)
  assert.match(runtime, /settlement_authority_contamination_detected/)
  assert.match(runtime, /immutable_ledger_promotion_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /repairEarning/)
  assert.doesNotMatch(runtime, /promoteLedger/)
  assert.doesNotMatch(runtime, /replacePayoutEligibility/)
})
