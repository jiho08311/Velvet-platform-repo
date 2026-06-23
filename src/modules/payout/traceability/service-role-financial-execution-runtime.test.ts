import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523001900_wave_010_fel_br_019_service_role_financial_execution_traceability.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/service-role-financial-execution-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/canonical-service-role-financial-execution-repository.ts"
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

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-019 introduces additive service-role financial execution topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_service_role_financial_execution/)
  assert.match(sql, /create table if not exists public\.canonical_service_role_lineage/)
  assert.match(sql, /create table if not exists public\.canonical_service_role_ordering/)
  assert.match(sql, /create table if not exists public\.canonical_service_role_reconstruction_metadata/)
  assert.match(sql, /service_role_execution_key text not null unique/)
  assert.match(sql, /service_role_lineage_key text not null unique/)
  assert.match(sql, /service_role_ordering_key text not null unique/)
  assert.match(sql, /service_role_reconstruction_key text not null unique/)
  assert.match(sql, /aggregate_root text not null default 'canonical_service_role_execution\.id'/)
  assert.match(sql, /financial_aggregate text not null default 'financial_governance_aggregate'/)
})

test("FEL-BR-019 schema is rollback-safe, advisory-only, and non-serving", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /service_role_runtime_authoritative boolean not null default true/)
  assert.match(sql, /privileged_runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /governance_execution_authority_allowed boolean not null default false/)
  assert.match(sql, /replay_owned_mutation_allowed boolean not null default false/)
  assert.match(sql, /replay_owned_execution_allowed boolean not null default false/)
  assert.match(sql, /service_role_replacement_allowed boolean not null default false/)
  assert.match(sql, /runtime_service_role_replacement_allowed boolean not null default false/)
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

test("FEL-BR-019 runtime is feature-gated, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const approvalService = read(APPROVAL_SERVICE_PATH)
  const executionService = read(EXECUTION_SERVICE_PATH)

  assert.match(flags, /WAVE_010_SERVICE_ROLE_FINANCIAL_EXECUTION_KILL_SWITCH/)
  assert.match(flags, /isWave010ServiceRoleFinancialExecutionTraceabilityEnabled/)
  assert.match(runtime, /isWave010ServiceRoleFinancialExecutionTraceabilityEnabled/)
  assert.match(runtime, /synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow/)
  assert.match(approvalService, /synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow/)
  assert.match(executionService, /synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /writeCanonicalServiceRoleFinancialExecutionTraceabilityNoThrow/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-019 preserves runtime service-role financial authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const approvalService = read(APPROVAL_SERVICE_PATH)
  const executionService = read(EXECUTION_SERVICE_PATH)

  assert.match(approvalService, /executeApprovePayoutRequestRpc/)
  assert.match(approvalService, /serviceRoleSurface: "service_role\.payout_rpc_execution"/)
  assert.match(executionService, /markPayoutRowAsPaid/)
  assert.match(executionService, /markPayoutRowAsFailed/)
  assert.match(executionService, /serviceRoleSurface: "service_role\.payout_terminal_runtime"/)
  assert.match(repository, /serviceRoleRuntimeAuthoritative: true/)
  assert.match(repository, /privilegedRuntimeAuthoritative: true/)
  assert.match(repository, /governanceExecutionAuthorityAllowed: false/)
  assert.match(repository, /replayOwnedMutationAllowed: false/)
  assert.match(repository, /replayOwnedExecutionAllowed: false/)
  assert.match(repository, /serviceRoleReplacementAllowed: false/)
  assert.match(repository, /runtimeServiceRoleReplacementAllowed: false/)
  assert.match(repository, /reconciliationRepairAllowed: false/)
  assert.match(runtime, /serviceRoleReplacementAllowed: false/)
  assert.match(runtime, /runtimeServiceRoleReplacementAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(runtime, /\.from\("payouts"\)/)
  assert.doesNotMatch(runtime, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(repository, /\.from\("payouts"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
})

test("FEL-BR-019 synchronizes only after authoritative runtime evidence", () => {
  const approvalService = read(APPROVAL_SERVICE_PATH)
  const executionService = read(EXECUTION_SERVICE_PATH)

  const approvalRpc = approvalService.indexOf(
    "const rows = await executeApprovePayoutRequestRpc"
  )
  const approvalPrivileged = approvalService.indexOf(
    "await synchronizePrivilegedExecutionTraceabilityNoThrow"
  )
  const approvalServiceRole = approvalService.indexOf(
    "await synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow"
  )
  const approvalPostcondition = approvalService.indexOf(
    "await verifyApprovedPayoutRequestPostcondition"
  )

  const paidMutation = executionService.indexOf("await markPayoutRowAsPaid")
  const paidTerminal = executionService.indexOf(
    "await synchronizePayoutTerminalProvenanceNoThrow"
  )
  const paidServiceRole = executionService.indexOf(
    "await synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow"
  )

  const failedMutation = executionService.indexOf("await markPayoutRowAsFailed")
  const failedTerminal = executionService.indexOf(
    "await synchronizePayoutTerminalProvenanceNoThrow",
    paidTerminal + 1
  )
  const failedServiceRole = executionService.indexOf(
    "await synchronizeServiceRoleFinancialExecutionTraceabilityNoThrow",
    paidServiceRole + 1
  )

  assert.ok(approvalRpc > -1)
  assert.ok(approvalPrivileged > approvalRpc)
  assert.ok(approvalServiceRole > approvalPrivileged)
  assert.ok(approvalPostcondition > approvalServiceRole)
  assert.ok(paidMutation > -1)
  assert.ok(paidTerminal > paidMutation)
  assert.ok(paidServiceRole > paidTerminal)
  assert.ok(failedMutation > -1)
  assert.ok(failedTerminal > failedMutation)
  assert.ok(failedServiceRole > failedTerminal)
})

test("FEL-BR-019 exposes advisory blockers without service-role mutation authority", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /missing_service_role_lineage_detected/)
  assert.match(runtime, /service_role_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_service_role_gap_detected/)
  assert.match(runtime, /privileged_execution_mismatch_detected/)
  assert.match(runtime, /replay_owned_service_role_mutation_detected/)
  assert.match(runtime, /governance_owned_execution_authority_detected/)
  assert.match(runtime, /service_role_authority_contamination_detected/)
  assert.match(runtime, /service_role_replacement_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /repairPayout/)
  assert.doesNotMatch(runtime, /executePayout/)
  assert.doesNotMatch(runtime, /replaceServiceRole/)
})
