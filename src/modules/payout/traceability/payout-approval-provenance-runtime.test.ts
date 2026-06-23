import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523001500_wave_010_fel_br_015_payout_approval_provenance.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/payout-approval-provenance-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/canonical-payout-approval-provenance-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/payout/feature-flags.ts"
)
const APPROVAL_SERVICE_PATH = join(
  process.cwd(),
  "src/modules/payout/services/payout-request-approval-service.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-015 introduces additive payout approval provenance topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_payout_approvals/)
  assert.match(sql, /create table if not exists public\.canonical_payout_approval_lineage/)
  assert.match(sql, /create table if not exists public\.canonical_payout_approval_ordering/)
  assert.match(sql, /create table if not exists public\.canonical_payout_approval_reconstruction_metadata/)
  assert.match(sql, /create table if not exists public\.canonical_payout_privileged_execution_metadata/)
  assert.match(sql, /payout_approval_key text not null unique/)
  assert.match(sql, /payout_approval_lineage_key text not null unique/)
  assert.match(sql, /payout_approval_ordering_key text not null unique/)
  assert.match(sql, /privileged_execution_key text not null unique/)
  assert.match(sql, /reconstruction_confidence text not null default 'payout_approval_runtime_observed'/)
})

test("FEL-BR-015 schema is additive, rollback-safe, and non-serving", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /payout_runtime_authoritative boolean not null default true/)
  assert.match(sql, /privileged_execution_runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /authority_mode text not null default 'synchronized_candidate'/)
  assert.match(sql, /enforcement_mode text not null default 'none'/)
  assert.match(sql, /promotion_allowed boolean not null default false/)
  assert.match(sql, /rollback_safe boolean not null default true/)
  assert.match(sql, /fail_open boolean not null default true/)
  assert.match(sql, /payout_execution_transfer_allowed boolean not null default false/)
  assert.match(sql, /privileged_execution_replacement_allowed boolean not null default false/)
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

test("FEL-BR-015 runtime is feature-gated, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const service = read(APPROVAL_SERVICE_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /W10_OBSERVABILITY_ENABLED/)
  assert.match(flags, /WAVE_010_PAYOUT_APPROVAL_PROVENANCE_KILL_SWITCH/)
  assert.match(flags, /isWave010PayoutApprovalProvenanceEnabled/)
  assert.match(runtime, /isWave010PayoutApprovalProvenanceEnabled/)
  assert.match(runtime, /synchronizePayoutApprovalProvenanceNoThrow/)
  assert.match(service, /synchronizePayoutApprovalProvenanceNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /writeCanonicalPayoutApprovalProvenanceNoThrow/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-015 preserves payout approval and privileged execution authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const service = read(APPROVAL_SERVICE_PATH)

  assert.match(service, /executeApprovePayoutRequestRpc/)
  assert.match(service, /verifyApprovedPayoutRequestPostcondition/)
  assert.match(repository, /payoutApprovalRuntimeAuthorityPreserved: true/)
  assert.match(repository, /payoutRequestServiceAuthoritative: true/)
  assert.match(repository, /securityDefinerPayoutApprovalAuthoritative: true/)
  assert.match(repository, /payoutExecutionTransferAllowed: false/)
  assert.match(repository, /privilegedExecutionReplacementAllowed: false/)
  assert.match(repository, /replayOwnedExecutionAllowed: false/)
  assert.match(repository, /reconciliationRepairAllowed: false/)
  assert.match(runtime, /payoutExecutionTransferAllowed: false/)
  assert.match(runtime, /privilegedExecutionReplacementAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(runtime, /\.from\("payouts"\)/)
  assert.doesNotMatch(runtime, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(repository, /\.from\("payouts"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
})

test("FEL-BR-015 synchronizes only after runtime payout approval mutation", () => {
  const service = read(APPROVAL_SERVICE_PATH)

  const rpc = service.indexOf("const rows = await executeApprovePayoutRequestRpc")
  const approved = service.indexOf("const approvedRow = rows[0]")
  const shadow = service.indexOf("await writePayoutRequestApprovedShadowEvent")
  const canonical = service.indexOf("await synchronizePayoutApprovalProvenanceNoThrow")
  const postcondition = service.indexOf("await verifyApprovedPayoutRequestPostcondition")

  assert.ok(rpc > -1)
  assert.ok(approved > rpc)
  assert.ok(shadow > approved)
  assert.ok(canonical > shadow)
  assert.ok(postcondition > canonical)
})

test("FEL-BR-015 exposes advisory blockers without payout mutation authority", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /missing_payout_approval_lineage_detected/)
  assert.match(runtime, /payout_approval_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_payout_reconstruction_gap_detected/)
  assert.match(runtime, /payout_parity_divergence_detected/)
  assert.match(runtime, /privileged_execution_mismatch_detected/)
  assert.match(runtime, /replay_owned_payout_mutation_detected/)
  assert.match(runtime, /reconciliation_owned_payout_repair_detected/)
  assert.match(runtime, /payout_authority_contamination_detected/)
  assert.match(runtime, /privileged_execution_replacement_detected/)
  assert.match(runtime, /payout_execution_transfer_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /repairPayout/)
  assert.doesNotMatch(runtime, /executePayout/)
  assert.doesNotMatch(runtime, /replacePrivilegedExecution/)
})
