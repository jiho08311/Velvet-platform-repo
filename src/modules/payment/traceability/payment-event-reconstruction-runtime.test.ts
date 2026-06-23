import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523002000_wave_010_fel_br_020_canonical_payment_event_introduction.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/payment-event-reconstruction-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/canonical-payment-reconstruction-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/feature-flags.ts"
)
const PAYMENT_CONFIRMATION_SERVICE_PATH = join(
  process.cwd(),
  "src/modules/payment/services/payment-confirmation-service.ts"
)
const PAYMENT_WRITE_REPOSITORY_PATH = join(
  process.cwd(),
  "src/modules/payment/repositories/payment-write-repository.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-020 introduces additive payment reconstruction metadata topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(
    sql,
    /create table if not exists public\.canonical_payment_reconstruction_metadata/
  )
  assert.match(sql, /payment_reconstruction_key text not null unique/)
  assert.match(sql, /payment_event_key text/)
  assert.match(sql, /provider_correlation_key text/)
  assert.match(sql, /payment_ordering_key text/)
  assert.match(sql, /provider_reconstruction_key text/)
  assert.match(sql, /reconstruction_metadata jsonb not null default '\{\}'::jsonb/)
  assert.match(sql, /lineage_metadata jsonb not null default '\{\}'::jsonb/)
  assert.match(sql, /provenance_metadata jsonb not null default '\{\}'::jsonb/)
})

test("FEL-BR-020 schema is additive, rollback-safe, and non-authoritative", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /provider_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /ledger_authoritative boolean not null default false/)
  assert.match(sql, /replay_mutation_allowed boolean not null default false/)
  assert.match(sql, /replay_owned_execution_allowed boolean not null default false/)
  assert.match(sql, /provider_replay_mutation_allowed boolean not null default false/)
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
  assert.doesNotMatch(sql, /\balter table public\.payments\b/i)
})

test("FEL-BR-020 runtime is feature-gated, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)

  assert.match(flags, /WAVE_010_PAYMENT_RECONSTRUCTION_KILL_SWITCH/)
  assert.match(flags, /isWave010PaymentReconstructionEnabled/)
  assert.match(runtime, /isWave010PaymentReconstructionEnabled/)
  assert.match(runtime, /synchronizePaymentEventReconstructionNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /writeCanonicalPaymentReconstructionNoThrow/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-020 preserves payment runtime authority and provider authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const service = read(PAYMENT_CONFIRMATION_SERVICE_PATH)
  const writeRepository = read(PAYMENT_WRITE_REPOSITORY_PATH)

  assert.match(service, /provider\.confirmPayment/)
  assert.match(service, /markPaymentSucceededIfPending/)
  assert.match(service, /synchronizePaymentEventReconstructionNoThrow/)
  assert.match(writeRepository, /\.from\("payments"\)/)
  assert.match(repository, /canonical_payment_reconstruction_metadata/)
  assert.match(repository, /runtimeAuthoritative: true/)
  assert.match(repository, /providerAuthoritative: true/)
  assert.match(repository, /canonicalAuthoritative: false/)
  assert.match(repository, /servingAuthoritative: false/)
  assert.match(repository, /ledgerAuthoritative: false/)
  assert.match(repository, /replayMutationAllowed: false/)
  assert.match(repository, /reconciliationRepairAllowed: false/)
  assert.match(runtime, /ledgerAuthoritative: false/)
  assert.match(runtime, /replayMutationAllowed: false/)
  assert.match(runtime, /reconciliationRepairAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("payments"\)/)
  assert.doesNotMatch(repository, /\.from\("payments"\)/)
  assert.doesNotMatch(service, /\.from\("canonical_payment_reconstruction_metadata"\)/)
})

test("FEL-BR-020 blocks promotion readiness on payment reconstruction contamination", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /payment_lineage_missing/)
  assert.match(runtime, /provider_correlation_missing/)
  assert.match(runtime, /payment_reconstruction_incomplete/)
  assert.match(runtime, /payment_replay_ordering_gap_detected/)
  assert.match(runtime, /replay_owned_payment_mutation_detected/)
  assert.match(runtime, /ledger_authority_contamination_detected/)
  assert.match(runtime, /payment_authority_contamination_detected/)
  assert.match(runtime, /reconciliation_owned_payment_repair_detected/)
  assert.match(runtime, /promotion_blocking/)
  assert.doesNotMatch(runtime, /confirmPayment\(/)
  assert.doesNotMatch(runtime, /markPaymentSucceededIfPending/)
})
