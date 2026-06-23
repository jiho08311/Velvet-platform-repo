import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523002500_wave_010_fel_br_025_payout_eligibility_provenance.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/payout-eligibility-provenance-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/canonical-payout-eligibility-provenance-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/feature-flags.ts"
)
const INDEX_PATH = join(process.cwd(), "src/shared/canonical/payout/index.ts")
const PAYOUT_REQUEST_SERVICE_PATH = join(
  process.cwd(),
  "src/modules/payout/services/payout-request-service.ts"
)
const ELIGIBILITY_POLICY_PATH = join(
  process.cwd(),
  "src/modules/payout/policies/payout-request-eligibility-policy.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-025 introduces additive canonical payout eligibility lineage topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_payout_eligibility/)
  assert.match(sql, /create table if not exists public\.canonical_payout_eligibility_lineage/)
  assert.match(sql, /create table if not exists public\.canonical_eligibility_ordering/)
  assert.match(sql, /create table if not exists public\.canonical_settlement_linkage_provenance/)
  assert.match(sql, /create table if not exists public\.canonical_eligibility_reconstruction_metadata/)
  assert.match(sql, /payout_eligibility_key text not null unique/)
  assert.match(sql, /payout_eligibility_lineage_key text not null unique/)
  assert.match(sql, /eligibility_ordering_key text not null unique/)
  assert.match(sql, /settlement_linkage_key text not null unique/)
  assert.match(sql, /eligibility_reconstruction_key text not null unique/)
  assert.match(sql, /legacy_payout_eligibility_key text/)
})

test("FEL-BR-025 schema is additive, rollback-safe, and non-serving", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /earnings_authoritative boolean not null default true/)
  assert.match(sql, /payout_eligibility_runtime_authoritative boolean not null default true/)
  assert.match(sql, /settlement_runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /authority_mode text not null default 'synchronized_candidate'/)
  assert.match(sql, /enforcement_mode text not null default 'none'/)
  assert.match(sql, /promotion_allowed boolean not null default false/)
  assert.match(sql, /rollback_safe boolean not null default true/)
  assert.match(sql, /fail_open boolean not null default true/)
  assert.match(sql, /immutable_ledger_promotion_allowed boolean not null default false/)
  assert.match(sql, /payout_authority_transfer_allowed boolean not null default false/)
  assert.match(sql, /payout_eligibility_replacement_allowed boolean not null default false/)
  assert.match(sql, /replay_mutation_allowed boolean not null default false/)
  assert.match(sql, /replay_owned_execution_allowed boolean not null default false/)
  assert.match(sql, /projection_balance_authority_allowed boolean not null default false/)
  assert.match(sql, /reconciliation_repair_allowed boolean not null default false/)
  assert.doesNotMatch(sql, /\bdrop column\b/i)
  assert.doesNotMatch(sql, /\bdrop table\b/i)
  assert.doesNotMatch(sql, /\bdelete from public\./i)
  assert.doesNotMatch(sql, /\btruncate table\b/i)
  assert.doesNotMatch(sql, /\brename column\b/i)
  assert.doesNotMatch(sql, /\brename to\b/i)
  assert.doesNotMatch(sql, /\balter table public\.earnings\b/i)
  assert.doesNotMatch(sql, /\balter table public\.payout_requests\b/i)
  assert.doesNotMatch(sql, /\balter table public\.payouts\b/i)
})

test("FEL-BR-025 runtime is feature-gated, exported, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const index = read(INDEX_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /W10_OBSERVABILITY_ENABLED/)
  assert.match(flags, /WAVE_010_PAYOUT_ELIGIBILITY_PROVENANCE_KILL_SWITCH/)
  assert.match(flags, /isWave010PayoutEligibilityProvenanceEnabled/)
  assert.match(runtime, /isWave010PayoutEligibilityProvenanceEnabled/)
  assert.match(runtime, /synchronizePayoutEligibilityProvenanceNoThrow/)
  assert.match(repository, /writeCanonicalPayoutEligibilityProvenanceNoThrow/)
  assert.match(index, /synchronizePayoutEligibilityProvenanceNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-025 preserves payout eligibility and settlement authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const service = read(PAYOUT_REQUEST_SERVICE_PATH)
  const policy = read(ELIGIBILITY_POLICY_PATH)

  assert.match(policy, /resolvePayoutRequestEligibility/)
  assert.match(policy, /assertPayoutRequestEligibility/)
  assert.match(service, /assertPayoutRequestEligibility/)
  assert.match(service, /lockEarningRowsForPayoutRequest/)
  assert.match(repository, /runtimeEligibilityAuthorityPreserved: true/)
  assert.match(repository, /earningsMutableSettlementAuthorityPreserved: true/)
  assert.match(repository, /settlementRuntimeAuthorityPreserved: true/)
  assert.match(repository, /immutableLedgerPromotionAllowed: false/)
  assert.match(repository, /payoutAuthorityTransferAllowed: false/)
  assert.match(repository, /payoutEligibilityReplacementAllowed: false/)
  assert.match(repository, /replayMutationAllowed: false/)
  assert.match(repository, /projectionBalanceAuthorityAllowed: false/)
  assert.match(repository, /reconciliationRepairAllowed: false/)
  assert.match(runtime, /payoutEligibilityReplacementAllowed: false/)
  assert.match(runtime, /earningsRemainAuthoritativeMutableSettlementState: true/)
  assert.doesNotMatch(runtime, /\.from\("earnings"\)/)
  assert.doesNotMatch(runtime, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(runtime, /\.from\("payouts"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(repository, /\.from\("payouts"\)/)
})

test("FEL-BR-025 synchronizes after authoritative eligibility and earning lock evidence", () => {
  const service = read(PAYOUT_REQUEST_SERVICE_PATH)

  const eligibility = service.indexOf("assertPayoutRequestEligibility")
  const insert = service.indexOf("const payoutRequest = await insertPayoutRequestRow")
  const lock = service.indexOf("const updatedEarnings = await lockEarningRowsForPayoutRequest")
  const shadowLineage = service.indexOf("await writeEarningToPayoutRequestShadowLineages")
  const allocationSync = service.indexOf("await synchronizeSettlementAllocationLineageNoThrow")
  const eligibilitySync = service.indexOf("await synchronizePayoutEligibilityProvenanceNoThrow")
  const compensation = service.lastIndexOf("tracePayoutRequestCreationCompensation")

  assert.ok(eligibility > -1)
  assert.ok(insert > eligibility)
  assert.ok(lock > insert)
  assert.ok(shadowLineage > lock)
  assert.ok(allocationSync > shadowLineage)
  assert.ok(eligibilitySync > allocationSync)
  assert.ok(compensation > eligibilitySync)
})

test("FEL-BR-025 exposes promotion blockers without replay or repair authority", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /eligibility_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_eligibility_gap_detected/)
  assert.match(runtime, /settlement_linkage_mismatch_detected/)
  assert.match(runtime, /orphaned_eligibility_lineage_detected/)
  assert.match(runtime, /eligibility_lineage_divergence_detected/)
  assert.match(runtime, /eligibility_reconstruction_instability_detected/)
  assert.match(runtime, /replay_owned_eligibility_mutation_detected/)
  assert.match(runtime, /settlement_authority_contamination_detected/)
  assert.match(runtime, /projection_owned_balance_authority_detected/)
  assert.match(runtime, /immutable_ledger_promotion_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /repairEligibility/)
  assert.doesNotMatch(runtime, /replacePayoutEligibility/)
  assert.doesNotMatch(runtime, /promoteLedger/)
})
