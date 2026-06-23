import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523001600_wave_010_fel_br_016_payout_terminal_provenance.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/payout-terminal-provenance-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/canonical-payout-terminal-provenance-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/feature-flags.ts"
)
const EXECUTION_SERVICE_PATH = join(
  process.cwd(),
  "src/modules/payout/services/payout-execution-service.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-016 introduces additive payout terminal provenance topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_payout_terminal_events/)
  assert.match(sql, /create table if not exists public\.canonical_payout_terminal_lineage/)
  assert.match(sql, /create table if not exists public\.canonical_payout_terminal_ordering/)
  assert.match(sql, /create table if not exists public\.canonical_payout_parity_metadata/)
  assert.match(sql, /create table if not exists public\.canonical_payout_reconstruction_metadata/)
  assert.match(sql, /payout_terminal_event_key text not null unique/)
  assert.match(sql, /payout_terminal_lineage_key text not null unique/)
  assert.match(sql, /payout_terminal_ordering_key text not null unique/)
  assert.match(sql, /payout_parity_key text not null unique/)
  assert.match(sql, /payout_reconstruction_key text not null unique/)
})

test("FEL-BR-016 schema is additive, rollback-safe, and non-serving", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /payout_runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /authority_mode text not null default 'synchronized_candidate'/)
  assert.match(sql, /enforcement_mode text not null default 'none'/)
  assert.match(sql, /promotion_allowed boolean not null default false/)
  assert.match(sql, /rollback_safe boolean not null default true/)
  assert.match(sql, /fail_open boolean not null default true/)
  assert.match(sql, /payout_execution_transfer_allowed boolean not null default false/)
  assert.match(sql, /shadow_payout_execution_allowed boolean not null default false/)
  assert.match(sql, /replay_mutation_allowed boolean not null default false/)
  assert.match(sql, /replay_owned_execution_allowed boolean not null default false/)
  assert.match(sql, /reconciliation_repair_allowed boolean not null default false/)
  assert.doesNotMatch(sql, /\bdrop column\b/i)
  assert.doesNotMatch(sql, /\bdrop table\b/i)
  assert.doesNotMatch(sql, /\bdelete from public\./i)
  assert.doesNotMatch(sql, /\btruncate table\b/i)
  assert.doesNotMatch(sql, /\brename column\b/i)
  assert.doesNotMatch(sql, /\brename to\b/i)
  assert.doesNotMatch(sql, /\balter table public\.payout_requests\b/i)
  assert.doesNotMatch(sql, /\balter table public\.payouts\b/i)
  assert.doesNotMatch(sql, /\balter table public\.earnings\b/i)
})

test("FEL-BR-016 runtime is feature-gated, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const service = read(EXECUTION_SERVICE_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /W10_OBSERVABILITY_ENABLED/)
  assert.match(flags, /WAVE_010_PAYOUT_TERMINAL_PROVENANCE_KILL_SWITCH/)
  assert.match(flags, /isWave010PayoutTerminalProvenanceEnabled/)
  assert.match(runtime, /isWave010PayoutTerminalProvenanceEnabled/)
  assert.match(runtime, /synchronizePayoutTerminalProvenanceNoThrow/)
  assert.match(service, /synchronizePayoutTerminalProvenanceNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /writeCanonicalPayoutTerminalProvenanceNoThrow/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-016 preserves payout terminal execution authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const service = read(EXECUTION_SERVICE_PATH)

  assert.match(service, /markPayoutRowAsPaid/)
  assert.match(service, /markEarningRowsAsPaidOutForPayout/)
  assert.match(service, /verifyPaidPayoutExecutionPostcondition/)
  assert.match(service, /markPayoutRowAsFailed/)
  assert.match(service, /releaseEarningRowsForFailedPayout/)
  assert.match(service, /verifyFailedPayoutExecutionPostcondition/)
  assert.match(repository, /payoutTerminalRuntimeAuthorityPreserved: true/)
  assert.match(repository, /payoutExecutionServiceAuthoritative: true/)
  assert.match(repository, /markPayoutAsPaidAuthoritative: true/)
  assert.match(repository, /payoutWriteRepositoryAuthoritative: true/)
  assert.match(repository, /earningWriteRepositoryAuthoritative: true/)
  assert.match(repository, /payoutExecutionTransferAllowed: false/)
  assert.match(repository, /shadowPayoutExecutionAllowed: false/)
  assert.match(repository, /replayOwnedExecutionAllowed: false/)
  assert.match(repository, /reconciliationRepairAllowed: false/)
  assert.match(runtime, /payoutExecutionTransferAllowed: false/)
  assert.match(runtime, /shadowPayoutExecutionAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(runtime, /\.from\("payouts"\)/)
  assert.doesNotMatch(runtime, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(repository, /\.from\("payouts"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
})

test("FEL-BR-016 synchronizes only after terminal runtime mutation and shadow lineage", () => {
  const service = read(EXECUTION_SERVICE_PATH)

  const paidMutation = service.indexOf("await markPayoutRowAsPaid")
  const paidPostcondition = service.indexOf("await verifyPaidPayoutExecutionPostcondition")
  const paidShadow = service.indexOf("await writePayoutPaidTerminalShadowLineages")
  const paidCanonical = service.indexOf(
    "await synchronizePayoutTerminalProvenanceNoThrow"
  )

  const failedMutation = service.indexOf("await markPayoutRowAsFailed")
  const failedPostcondition = service.indexOf("await verifyFailedPayoutExecutionPostcondition")
  const failedShadow = service.indexOf("await writePayoutFailedTerminalShadowLineages")
  const failedCanonical = service.indexOf(
    "await synchronizePayoutTerminalProvenanceNoThrow",
    paidCanonical + 1
  )

  assert.ok(paidMutation > -1)
  assert.ok(paidPostcondition > paidMutation)
  assert.ok(paidShadow > paidPostcondition)
  assert.ok(paidCanonical > paidShadow)
  assert.ok(failedMutation > -1)
  assert.ok(failedPostcondition > failedMutation)
  assert.ok(failedShadow > failedPostcondition)
  assert.ok(failedCanonical > failedShadow)
})

test("FEL-BR-016 exposes advisory blockers without payout execution authority", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /payout_terminal_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_payout_gap_detected/)
  assert.match(runtime, /payout_parity_mismatch_detected/)
  assert.match(runtime, /earning_paid_out_linkage_mismatch_detected/)
  assert.match(runtime, /payout_lineage_divergence_detected/)
  assert.match(runtime, /replay_owned_payout_execution_detected/)
  assert.match(runtime, /shadow_payout_execution_detected/)
  assert.match(runtime, /reconciliation_owned_payout_repair_detected/)
  assert.match(runtime, /payout_authority_contamination_detected/)
  assert.match(runtime, /payout_execution_transfer_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /repairPayout/)
  assert.doesNotMatch(runtime, /executePayout/)
  assert.doesNotMatch(runtime, /replacePayoutExecution/)
})
