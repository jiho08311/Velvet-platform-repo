import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523002200_wave_010_fel_br_022_canonical_settlement_event_introduction.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/settlement/settlement-event-topology-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/settlement/canonical-settlement-event-topology-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/settlement/feature-flags.ts"
)
const INDEX_PATH = join(
  process.cwd(),
  "src/shared/canonical/settlement/index.ts"
)
const CREATE_EARNING_PATH = join(
  process.cwd(),
  "src/modules/payout/runtime/create-earning.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-022 introduces additive settlement event topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_settlement_ordering/)
  assert.match(sql, /create table if not exists public\.canonical_settlement_provenance/)
  assert.match(sql, /create table if not exists public\.canonical_settlement_reconstruction_metadata/)
  assert.match(sql, /settlement_ordering_key text not null unique/)
  assert.match(sql, /settlement_provenance_key text not null unique/)
  assert.match(sql, /settlement_reconstruction_key text not null unique/)
  assert.match(sql, /settlement_event_key text not null/)
  assert.match(sql, /ordering_confidence text not null default 'observed_runtime_settlement'/)
  assert.match(sql, /reconstruction_confidence text not null default 'settlement_runtime_observed'/)
})

test("FEL-BR-022 schema is additive, rollback-safe, and non-serving", () => {
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

test("FEL-BR-022 runtime is feature-gated, no-throw, and kill-switchable", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const index = read(INDEX_PATH)
  const createEarning = read(CREATE_EARNING_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /WAVE_010_SETTLEMENT_EVENT_TOPOLOGY_KILL_SWITCH/)
  assert.match(flags, /isWave010SettlementEventTopologyEnabled/)
  assert.match(runtime, /isWave010SettlementEventTopologyEnabled/)
  assert.match(runtime, /synchronizeSettlementEventTopologyNoThrow/)
  assert.match(repository, /writeCanonicalSettlementEventTopologyNoThrow/)
  assert.match(index, /synchronizeSettlementEventTopologyNoThrow/)
  assert.match(createEarning, /synchronizeSettlementEventTopologyNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-022 preserves settlement and payout eligibility authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const createEarning = read(CREATE_EARNING_PATH)

  assert.match(createEarning, /insertEarningCreationRow/)
  assert.match(createEarning, /synchronizeEarningCreationProvenanceNoThrow/)
  assert.match(repository, /earningLifecycleRuntimeAuthorityPreserved: true/)
  assert.match(repository, /earningsMutableSettlementStatePreserved: true/)
  assert.match(repository, /payoutEligibilityRuntimeAuthorityPreserved: true/)
  assert.match(repository, /immutableLedgerPromotionAllowed: false/)
  assert.match(repository, /payoutEligibilityReplacementAllowed: false/)
  assert.match(repository, /replayMutationAllowed: false/)
  assert.match(repository, /replayOwnedExecutionAllowed: false/)
  assert.match(repository, /reconciliationRepairAllowed: false/)
  assert.match(runtime, /immutableLedgerPromotionAllowed: false/)
  assert.match(runtime, /payoutEligibilityReplacementAllowed: false/)
  assert.match(runtime, /replayMutationAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("earnings"\)/)
  assert.doesNotMatch(runtime, /\.from\("payments"\)/)
  assert.doesNotMatch(runtime, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(runtime, /\.from\("payouts"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payments"\)/)
  assert.doesNotMatch(repository, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(repository, /\.from\("payouts"\)/)
})

test("FEL-BR-022 synchronizes after legacy settlement and BR-014 provenance", () => {
  const createEarning = read(CREATE_EARNING_PATH)

  const insert = createEarning.indexOf("const data = await insertEarningCreationRow")
  const shadowEvent = createEarning.indexOf("await writeEarningCreatedShadowEvent")
  const shadowLineage = createEarning.indexOf("await writePaymentToEarningShadowLineage")
  const provenance = createEarning.indexOf("await synchronizeEarningCreationProvenanceNoThrow")
  const topology = createEarning.indexOf("await synchronizeSettlementEventTopologyNoThrow")
  const audit = createEarning.indexOf("await createAuditLog")

  assert.ok(insert > -1)
  assert.ok(shadowEvent > insert)
  assert.ok(shadowLineage > shadowEvent)
  assert.ok(provenance > shadowLineage)
  assert.ok(topology > provenance)
  assert.ok(audit > topology)
})

test("FEL-BR-022 exposes advisory blockers without repair or promotion authority", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /settlement_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_settlement_gap_detected/)
  assert.match(runtime, /payout_eligibility_mismatch_detected/)
  assert.match(runtime, /orphaned_earning_linkage_detected/)
  assert.match(runtime, /replay_owned_settlement_mutation_detected/)
  assert.match(runtime, /settlement_authority_contamination_detected/)
  assert.match(runtime, /immutable_ledger_promotion_detected/)
  assert.match(runtime, /projection_owned_balance_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /repairEarning/)
  assert.doesNotMatch(runtime, /promoteLedger/)
  assert.doesNotMatch(runtime, /replacePayoutEligibility/)
})
