import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523002400_wave_010_fel_br_024_canonical_payout_event_introduction.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/payout-event-topology-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/canonical-payout-event-topology-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/feature-flags.ts"
)
const INDEX_PATH = join(process.cwd(), "src/shared/canonical/payout/index.ts")
const APPROVAL_SERVICE_PATH = join(
  process.cwd(),
  "src/modules/payout/services/payout-request-approval-service.ts"
)
const EXECUTION_SERVICE_PATH = join(
  process.cwd(),
  "src/modules/payout/services/payout-execution-service.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-024 introduces additive canonical payout event topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_payout_events/)
  assert.match(sql, /create table if not exists public\.canonical_payout_ordering/)
  assert.match(sql, /create table if not exists public\.canonical_payout_provenance/)
  assert.match(sql, /alter table public\.canonical_payout_reconstruction_metadata/)
  assert.match(sql, /add column if not exists payout_event_key text/)
  assert.match(sql, /add column if not exists replay_safe_ordering_observed boolean not null default false/)
  assert.match(sql, /payout_event_key text not null unique/)
  assert.match(sql, /payout_ordering_key text not null unique/)
  assert.match(sql, /payout_provenance_key text not null unique/)
})

test("FEL-BR-024 schema remains rollback-safe, additive, and non-serving", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /payout_runtime_authoritative boolean not null default true/)
  assert.match(sql, /payout_terminal_execution_authoritative boolean not null default true/)
  assert.match(sql, /payout_approval_execution_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /authority_mode text not null default 'synchronized_candidate'/)
  assert.match(sql, /enforcement_mode text not null default 'none'/)
  assert.match(sql, /promotion_allowed boolean not null default false/)
  assert.match(sql, /rollback_safe boolean not null default true/)
  assert.match(sql, /fail_open boolean not null default true/)
  assert.match(sql, /payout_execution_transfer_allowed boolean not null default false/)
  assert.match(sql, /runtime_payout_replacement_allowed boolean not null default false/)
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

test("FEL-BR-024 runtime is feature-gated, exported, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const index = read(INDEX_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /W10_OBSERVABILITY_ENABLED/)
  assert.match(flags, /WAVE_010_CANONICAL_PAYOUT_EVENT_TOPOLOGY_KILL_SWITCH/)
  assert.match(flags, /isWave010CanonicalPayoutEventTopologyEnabled/)
  assert.match(runtime, /isWave010CanonicalPayoutEventTopologyEnabled/)
  assert.match(runtime, /synchronizePayoutEventTopologyNoThrow/)
  assert.match(repository, /writeCanonicalPayoutEventTopologyNoThrow/)
  assert.match(index, /synchronizePayoutEventTopologyNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-024 preserves payout runtime and execution authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const approvalService = read(APPROVAL_SERVICE_PATH)
  const executionService = read(EXECUTION_SERVICE_PATH)

  assert.match(approvalService, /executeApprovePayoutRequestRpc/)
  assert.match(executionService, /markPayoutRowAsPaid/)
  assert.match(executionService, /markPayoutRowAsFailed/)
  assert.match(repository, /payoutRuntimeAuthorityPreserved: true/)
  assert.match(repository, /payoutTerminalExecutionAuthorityPreserved: true/)
  assert.match(repository, /payoutApprovalExecutionAuthorityPreserved: true/)
  assert.match(repository, /payoutExecutionTransferAllowed: false/)
  assert.match(repository, /runtimePayoutReplacementAllowed: false/)
  assert.match(repository, /replayOwnedExecutionAllowed: false/)
  assert.match(repository, /reconciliationRepairAllowed: false/)
  assert.match(runtime, /runtimePayoutReplacementAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(runtime, /\.from\("payouts"\)/)
  assert.doesNotMatch(runtime, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(repository, /\.from\("payouts"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
})

test("FEL-BR-024 synchronizes only after authoritative payout runtime evidence", () => {
  const approvalService = read(APPROVAL_SERVICE_PATH)
  const executionService = read(EXECUTION_SERVICE_PATH)

  const rpc = approvalService.indexOf(
    "const rows = await executeApprovePayoutRequestRpc"
  )
  const approvalProvenance = approvalService.indexOf(
    "await synchronizePayoutApprovalProvenanceNoThrow"
  )
  const approvalEvent = approvalService.indexOf(
    "await synchronizePayoutEventTopologyNoThrow"
  )

  const paidMutation = executionService.indexOf("await markPayoutRowAsPaid")
  const paidTerminalProvenance = executionService.indexOf(
    "await synchronizePayoutTerminalProvenanceNoThrow"
  )
  const paidEvent = executionService.indexOf(
    "await synchronizePayoutEventTopologyNoThrow"
  )

  const failedMutation = executionService.indexOf("await markPayoutRowAsFailed")
  const failedTerminalProvenance = executionService.indexOf(
    "await synchronizePayoutTerminalProvenanceNoThrow",
    paidTerminalProvenance + 1
  )
  const failedEvent = executionService.indexOf(
    "await synchronizePayoutEventTopologyNoThrow",
    paidEvent + 1
  )

  assert.ok(rpc > -1)
  assert.ok(approvalProvenance > rpc)
  assert.ok(approvalEvent > approvalProvenance)
  assert.ok(paidMutation > -1)
  assert.ok(paidTerminalProvenance > paidMutation)
  assert.ok(paidEvent > paidTerminalProvenance)
  assert.ok(failedMutation > -1)
  assert.ok(failedTerminalProvenance > failedMutation)
  assert.ok(failedEvent > failedTerminalProvenance)
})

test("FEL-BR-024 exposes promotion blockers without repair authority", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /payout_lineage_divergence_detected/)
  assert.match(runtime, /payout_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_payout_gap_detected/)
  assert.match(runtime, /payout_lifecycle_mismatch_detected/)
  assert.match(runtime, /missing_payout_lineage_detected/)
  assert.match(runtime, /payout_reconstruction_instability_detected/)
  assert.match(runtime, /replay_owned_payout_mutation_detected/)
  assert.match(runtime, /payout_authority_contamination_detected/)
  assert.match(runtime, /reconciliation_owned_payout_repair_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /repairPayout/)
  assert.doesNotMatch(runtime, /replacePayoutRuntime/)
  assert.doesNotMatch(runtime, /executePayout/)
})
