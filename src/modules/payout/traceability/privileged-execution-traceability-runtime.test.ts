import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523001800_wave_010_fel_br_018_security_definer_invocation_traceability.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/privileged-execution-traceability-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/canonical-privileged-execution-traceability-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/feature-flags.ts"
)
const APPROVAL_SERVICE_PATH = join(
  process.cwd(),
  "src/modules/payout/services/payout-request-approval-service.ts"
)
const EXECUTION_SERVICE_PATH = join(
  process.cwd(),
  "src/modules/payout/services/payout-execution-service.ts"
)
const PAYOUT_WRITE_REPOSITORY_PATH = join(
  process.cwd(),
  "src/modules/payout/repositories/payout-write-repository.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-018 introduces additive privileged execution traceability topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_financial_privileged_execution/)
  assert.match(sql, /create table if not exists public\.canonical_security_definer_lineage/)
  assert.match(sql, /create table if not exists public\.canonical_privileged_ordering/)
  assert.match(sql, /create table if not exists public\.canonical_privileged_reconstruction_metadata/)
  assert.match(sql, /privileged_execution_key text not null unique/)
  assert.match(sql, /security_definer_lineage_key text not null unique/)
  assert.match(sql, /privileged_ordering_key text not null unique/)
  assert.match(sql, /privileged_reconstruction_key text not null unique/)
  assert.match(sql, /defined_security_definer_surface text/)
  assert.match(sql, /observed_security_definer_invoked boolean not null default false/)
  assert.match(sql, /observed_runtime_surface text not null/)
})

test("FEL-BR-018 schema is rollback-safe, advisory-only, and non-serving", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /privileged_execution_runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /governance_execution_authority_allowed boolean not null default false/)
  assert.match(sql, /replay_owned_mutation_allowed boolean not null default false/)
  assert.match(sql, /replay_owned_execution_allowed boolean not null default false/)
  assert.match(sql, /payout_execution_transfer_allowed boolean not null default false/)
  assert.match(sql, /privileged_execution_replacement_allowed boolean not null default false/)
  assert.match(sql, /reconciliation_repair_allowed boolean not null default false/)
  assert.match(sql, /authority_mode text not null default 'synchronized_candidate'/)
  assert.match(sql, /enforcement_mode text not null default 'none'/)
  assert.match(sql, /promotion_allowed boolean not null default false/)
  assert.match(sql, /rollback_safe boolean not null default true/)
  assert.match(sql, /fail_open boolean not null default true/)
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

test("FEL-BR-018 runtime is feature-gated, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const approvalService = read(APPROVAL_SERVICE_PATH)
  const executionService = read(EXECUTION_SERVICE_PATH)

  assert.match(flags, /WAVE_010_SECURITY_DEFINER_LINEAGE_KILL_SWITCH/)
  assert.match(flags, /isWave010SecurityDefinerLineageEnabled/)
  assert.match(runtime, /isWave010SecurityDefinerLineageEnabled/)
  assert.match(runtime, /synchronizePrivilegedExecutionTraceabilityNoThrow/)
  assert.match(approvalService, /synchronizePrivilegedExecutionTraceabilityNoThrow/)
  assert.match(executionService, /synchronizePrivilegedExecutionTraceabilityNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /writeCanonicalPrivilegedExecutionTraceabilityNoThrow/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-018 preserves privileged payout execution authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const approvalService = read(APPROVAL_SERVICE_PATH)
  const executionService = read(EXECUTION_SERVICE_PATH)
  const payoutWriteRepository = read(PAYOUT_WRITE_REPOSITORY_PATH)

  assert.match(approvalService, /executeApprovePayoutRequestRpc/)
  assert.match(approvalService, /observedSecurityDefinerInvoked: true/)
  assert.match(executionService, /markPayoutRowAsPaid/)
  assert.match(executionService, /definedSecurityDefinerSurface: "mark_payout_as_paid"/)
  assert.match(executionService, /observedSecurityDefinerInvoked: false/)
  assert.match(executionService, /observedRuntimeSurface: "payout_execution_service\.markPayoutRowAsPaid"/)
  assert.match(payoutWriteRepository, /\.from\("payouts"\)/)
  assert.doesNotMatch(payoutWriteRepository, /\.rpc\(\s*"mark_payout_as_paid"/)
  assert.match(repository, /securityDefinerExecutionAuthorityPreserved: true/)
  assert.match(repository, /privilegedPayoutRpcExecutionAuthorityPreserved: true/)
  assert.match(repository, /governanceExecutionAuthorityAllowed: false/)
  assert.match(repository, /replayOwnedMutationAllowed: false/)
  assert.match(repository, /payoutExecutionTransferAllowed: false/)
  assert.match(runtime, /governanceOwnedExecutionAuthorityAllowed: false/)
  assert.match(runtime, /replayOwnedPrivilegedMutationAllowed: false/)
  assert.match(runtime, /payoutExecutionTransferAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(runtime, /\.from\("payouts"\)/)
  assert.doesNotMatch(runtime, /\.from\("earnings"\)/)
})

test("FEL-BR-018 synchronizes only after authoritative runtime mutation evidence", () => {
  const approvalService = read(APPROVAL_SERVICE_PATH)
  const executionService = read(EXECUTION_SERVICE_PATH)

  const rpc = approvalService.indexOf("const rows = await executeApprovePayoutRequestRpc")
  const approvalProvenance = approvalService.indexOf(
    "await synchronizePayoutApprovalProvenanceNoThrow"
  )
  const privilegedApproval = approvalService.indexOf(
    "await synchronizePrivilegedExecutionTraceabilityNoThrow"
  )
  const approvalPostcondition = approvalService.indexOf(
    "await verifyApprovedPayoutRequestPostcondition"
  )

  const paidMutation = executionService.indexOf("await markPayoutRowAsPaid")
  const paidPostcondition = executionService.indexOf(
    "await verifyPaidPayoutExecutionPostcondition"
  )
  const terminalProvenance = executionService.indexOf(
    "await synchronizePayoutTerminalProvenanceNoThrow"
  )
  const privilegedTerminal = executionService.indexOf(
    "await synchronizePrivilegedExecutionTraceabilityNoThrow"
  )

  assert.ok(rpc > -1)
  assert.ok(approvalProvenance > rpc)
  assert.ok(privilegedApproval > approvalProvenance)
  assert.ok(approvalPostcondition > privilegedApproval)
  assert.ok(paidMutation > -1)
  assert.ok(paidPostcondition > paidMutation)
  assert.ok(terminalProvenance > paidPostcondition)
  assert.ok(privilegedTerminal > terminalProvenance)
})

test("FEL-BR-018 exposes advisory blockers without privileged mutation authority", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /missing_privileged_lineage_detected/)
  assert.match(runtime, /privileged_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_privileged_gap_detected/)
  assert.match(runtime, /security_definer_mismatch_detected/)
  assert.match(runtime, /replay_owned_privileged_mutation_detected/)
  assert.match(runtime, /governance_owned_execution_authority_detected/)
  assert.match(runtime, /payout_execution_transfer_detected/)
  assert.match(runtime, /privileged_authority_contamination_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /repairPayout/)
  assert.doesNotMatch(runtime, /executePayout/)
  assert.doesNotMatch(runtime, /replacePrivilegedExecution/)
})
