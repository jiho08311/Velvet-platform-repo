import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523002300_wave_010_fel_br_023_settlement_allocation_lineage.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/settlement/allocation-lineage-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/settlement/canonical-allocation-lineage-repository.ts"
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
const PAYOUT_REQUEST_SERVICE_PATH = join(
  process.cwd(),
  "src/modules/payout/services/payout-request-service.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-023 introduces additive allocation lineage topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_allocation_lineage/)
  assert.match(sql, /create table if not exists public\.canonical_allocation_ordering/)
  assert.match(sql, /create table if not exists public\.canonical_payout_eligibility_provenance/)
  assert.match(sql, /create table if not exists public\.canonical_allocation_reconstruction_metadata/)
  assert.match(sql, /allocation_lineage_key text not null unique/)
  assert.match(sql, /allocation_ordering_key text not null unique/)
  assert.match(sql, /payout_eligibility_key text not null unique/)
  assert.match(sql, /allocation_reconstruction_key text not null unique/)
  assert.match(sql, /ordering_confidence text not null default 'observed_runtime_allocation'/)
  assert.match(sql, /reconstruction_confidence text not null default 'allocation_runtime_observed'/)
})

test("FEL-BR-023 schema is additive, rollback-safe, and non-serving", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /earning_allocation_runtime_authoritative boolean not null default true/)
  assert.match(sql, /payout_eligibility_runtime_authoritative boolean not null default true/)
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
  assert.match(sql, /projection_balance_authority_allowed boolean not null default false/)
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

test("FEL-BR-023 runtime is feature-gated, no-throw, and kill-switchable", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const index = read(INDEX_PATH)
  const createEarning = read(CREATE_EARNING_PATH)
  const payoutRequestService = read(PAYOUT_REQUEST_SERVICE_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /WAVE_010_SETTLEMENT_ALLOCATION_LINEAGE_KILL_SWITCH/)
  assert.match(flags, /isWave010SettlementAllocationLineageEnabled/)
  assert.match(runtime, /isWave010SettlementAllocationLineageEnabled/)
  assert.match(runtime, /synchronizeSettlementAllocationLineageNoThrow/)
  assert.match(repository, /writeCanonicalAllocationLineageNoThrow/)
  assert.match(index, /synchronizeSettlementAllocationLineageNoThrow/)
  assert.match(createEarning, /synchronizeSettlementAllocationLineageNoThrow/)
  assert.match(payoutRequestService, /synchronizeSettlementAllocationLineageNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-023 preserves allocation and payout eligibility authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const createEarning = read(CREATE_EARNING_PATH)
  const payoutRequestService = read(PAYOUT_REQUEST_SERVICE_PATH)

  assert.match(createEarning, /insertEarningCreationRow/)
  assert.match(payoutRequestService, /assertPayoutRequestEligibility/)
  assert.match(payoutRequestService, /lockEarningRowsForPayoutRequest/)
  assert.match(repository, /runtimeAllocationAuthorityPreserved: true/)
  assert.match(repository, /payoutEligibilityRuntimeAuthorityPreserved: true/)
  assert.match(repository, /replayOwnedSettlementMutationAllowed: false/)
  assert.match(repository, /projectionBalanceAuthorityAllowed: false/)
  assert.match(repository, /immutableLedgerPromotionAllowed: false/)
  assert.match(repository, /payoutEligibilityReplacementAllowed: false/)
  assert.match(repository, /reconciliationRepairAllowed: false/)
  assert.match(runtime, /runtimeAllocationAuthorityPreserved: true/)
  assert.match(runtime, /payoutEligibilityReplacementAllowed: false/)
  assert.match(runtime, /projectionBalanceAuthorityAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("earnings"\)/)
  assert.doesNotMatch(runtime, /\.from\("payments"\)/)
  assert.doesNotMatch(runtime, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(runtime, /\.from\("payouts"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payments"\)/)
  assert.doesNotMatch(repository, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(repository, /\.from\("payouts"\)/)
})

test("FEL-BR-023 synchronizes after legacy earning and payout allocation mutations", () => {
  const createEarning = read(CREATE_EARNING_PATH)
  const payoutRequestService = read(PAYOUT_REQUEST_SERVICE_PATH)

  const insert = createEarning.indexOf("const data = await insertEarningCreationRow")
  const settlementTopology = createEarning.indexOf("await synchronizeSettlementEventTopologyNoThrow")
  const allocationLineage = createEarning.indexOf("await synchronizeSettlementAllocationLineageNoThrow")
  const audit = createEarning.indexOf("await createAuditLog")

  assert.ok(insert > -1)
  assert.ok(settlementTopology > insert)
  assert.ok(allocationLineage > settlementTopology)
  assert.ok(audit > allocationLineage)

  const lock = payoutRequestService.indexOf("const updatedEarnings = await lockEarningRowsForPayoutRequest")
  const shadowEvent = payoutRequestService.indexOf("await writeEarningsLockedForPayoutRequestShadowEvent")
  const shadowLineage = payoutRequestService.indexOf("await writeEarningToPayoutRequestShadowLineages")
  const allocationSync = payoutRequestService.indexOf("await synchronizeSettlementAllocationLineageNoThrow")
  const compensation = payoutRequestService.lastIndexOf("tracePayoutRequestCreationCompensation")

  assert.ok(lock > -1)
  assert.ok(shadowEvent > lock)
  assert.ok(shadowLineage > shadowEvent)
  assert.ok(allocationSync > shadowLineage)
  assert.ok(compensation > allocationSync)
})

test("FEL-BR-023 exposes advisory blockers without repair or promotion authority", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /allocation_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_allocation_gap_detected/)
  assert.match(runtime, /payout_eligibility_mismatch_detected/)
  assert.match(runtime, /orphaned_allocation_lineage_detected/)
  assert.match(runtime, /replay_owned_settlement_mutation_detected/)
  assert.match(runtime, /settlement_authority_contamination_detected/)
  assert.match(runtime, /projection_owned_balance_authority_detected/)
  assert.match(runtime, /immutable_ledger_promotion_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /repairAllocation/)
  assert.doesNotMatch(runtime, /promoteLedger/)
  assert.doesNotMatch(runtime, /replacePayoutEligibility/)
})
