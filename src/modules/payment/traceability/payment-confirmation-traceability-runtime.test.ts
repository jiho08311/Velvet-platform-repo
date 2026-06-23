import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523001000_wave_010_fel_br_010_payment_confirmation_traceability.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/payment-confirmation-traceability-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/canonical-payment-traceability-repository.ts"
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

test("FEL-BR-010 introduces additive payment confirmation traceability topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_payment_events/)
  assert.match(sql, /create table if not exists public\.canonical_payment_provider_correlations/)
  assert.match(sql, /create table if not exists public\.canonical_payment_confirmation_lineage/)
  assert.match(sql, /create table if not exists public\.canonical_payment_ordering/)
  assert.match(sql, /provider_reference_id text/)
  assert.match(sql, /replay_timestamp_source text not null/)
  assert.match(sql, /provenance_metadata jsonb not null default '\{\}'::jsonb/)
})

test("FEL-BR-010 schema is additive, rollback-safe, and non-authoritative", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /authority_mode text not null default 'synchronized_candidate'/)
  assert.match(sql, /enforcement_mode text not null default 'none'/)
  assert.match(sql, /promotion_allowed boolean not null default false/)
  assert.match(sql, /rollback_safe boolean not null default true/)
  assert.match(sql, /fail_open boolean not null default true/)
  assert.match(sql, /replay_mutation_allowed boolean not null default false/)
  assert.match(sql, /reconciliation_repair_allowed boolean not null default false/)
  assert.doesNotMatch(sql, /\bdrop column\b/i)
  assert.doesNotMatch(sql, /\bdrop table\b/i)
  assert.doesNotMatch(sql, /\bdelete from public\./i)
  assert.doesNotMatch(sql, /\btruncate table\b/i)
  assert.doesNotMatch(sql, /\brename column\b/i)
  assert.doesNotMatch(sql, /\brename to\b/i)
  assert.doesNotMatch(sql, /\balter table public\.payments\b/i)
})

test("FEL-BR-010 runtime is feature-gated, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /WAVE_010_PAYMENT_TRACEABILITY_KILL_SWITCH/)
  assert.match(runtime, /isWave010PaymentTraceabilityEnabled/)
  assert.match(runtime, /synchronizePaymentConfirmationTraceabilityNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /writeCanonicalPaymentTraceabilityNoThrow/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-010 preserves payment runtime authority and forbids replay repair", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const service = read(PAYMENT_CONFIRMATION_SERVICE_PATH)
  const writeRepository = read(PAYMENT_WRITE_REPOSITORY_PATH)

  assert.match(service, /markPaymentSucceededIfPending/)
  assert.match(service, /writePaymentConfirmedShadowEvent/)
  assert.match(service, /synchronizePaymentConfirmationTraceabilityNoThrow/)
  assert.match(writeRepository, /\.from\("payments"\)/)
  assert.match(writeRepository, /\.update\(\{\s*status: "succeeded"/)
  assert.match(repository, /runtimeAuthoritative: true/)
  assert.match(repository, /canonicalAuthoritative: false/)
  assert.match(repository, /servingAuthoritative: false/)
  assert.match(repository, /replayMutationAllowed: false/)
  assert.match(repository, /reconciliationRepairAllowed: false/)
  assert.match(runtime, /replayMutationAllowed: false/)
  assert.match(runtime, /reconciliationRepairAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("payments"\)/)
  assert.doesNotMatch(repository, /\.from\("payments"\)/)
  assert.doesNotMatch(service, /\.from\("canonical_payment_events"\)/)
})

test("FEL-BR-010 records provider correlation without replacing provider execution", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const service = read(PAYMENT_CONFIRMATION_SERVICE_PATH)

  assert.match(service, /provider\.confirmPayment/)
  assert.match(service, /providerResult\.providerReferenceId/)
  assert.match(runtime, /providerReferenceId/)
  assert.match(runtime, /providerOrderId/)
  assert.match(repository, /canonical_payment_provider_correlations/)
  assert.match(repository, /provider_reference_id/)
  assert.match(repository, /provider_order_id/)
  assert.doesNotMatch(service, /providerResult[\s\S]*\.update\(\{\s*provider_reference_id/)
})
