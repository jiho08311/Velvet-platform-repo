import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523001200_wave_010_fel_br_012_provider_correlation_traceability.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/provider-correlation-traceability-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/canonical-provider-correlation-traceability-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/feature-flags.ts"
)
const PAYMENT_CONFIRMATION_SERVICE_PATH = join(
  process.cwd(),
  "src/modules/payment/services/payment-confirmation-service.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-012 introduces additive provider correlation traceability topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_provider_lineage/)
  assert.match(sql, /create table if not exists public\.canonical_provider_ordering/)
  assert.match(
    sql,
    /create table if not exists public\.canonical_provider_reconstruction_metadata/
  )
  assert.match(sql, /provider_reference_id text/)
  assert.match(sql, /provider_order_id text/)
  assert.match(sql, /replay_timestamp_source text not null/)
  assert.match(sql, /provenance_metadata jsonb not null default '\{\}'::jsonb/)
})

test("FEL-BR-012 schema is additive, rollback-safe, and non-authoritative", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /provider_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
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

test("FEL-BR-012 runtime is feature-gated, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)

  assert.match(flags, /WAVE_010_PROVIDER_CORRELATION_TRACEABILITY_KILL_SWITCH/)
  assert.match(flags, /isWave010ProviderCorrelationTraceabilityEnabled/)
  assert.match(runtime, /isWave010ProviderCorrelationTraceabilityEnabled/)
  assert.match(runtime, /synchronizeProviderCorrelationTraceabilityNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /writeCanonicalProviderCorrelationTraceabilityNoThrow/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-012 preserves provider and payment runtime authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const service = read(PAYMENT_CONFIRMATION_SERVICE_PATH)

  assert.match(service, /provider\.confirmPayment/)
  assert.match(service, /markPaymentSucceededIfPending/)
  assert.match(service, /synchronizeProviderCorrelationTraceabilityNoThrow/)
  assert.match(repository, /canonical_provider_lineage/)
  assert.match(repository, /canonical_provider_ordering/)
  assert.match(repository, /canonical_provider_reconstruction_metadata/)
  assert.match(repository, /providerAuthoritative: true/)
  assert.match(repository, /canonicalAuthoritative: false/)
  assert.match(repository, /servingAuthoritative: false/)
  assert.match(repository, /providerReplayMutationAllowed: false/)
  assert.match(runtime, /replayOwnedExecutionAllowed: false/)
  assert.match(runtime, /providerReplayMutationAllowed: false/)
  assert.match(runtime, /reconciliationRepairAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("payments"\)/)
  assert.doesNotMatch(repository, /\.from\("payments"\)/)
  assert.doesNotMatch(service, /\.from\("canonical_provider_lineage"\)/)
})

test("FEL-BR-012 adds provider completeness signals without provider replay execution", () => {
  const runtime = read(RUNTIME_PATH)
  const service = read(PAYMENT_CONFIRMATION_SERVICE_PATH)

  const providerConfirmCalls = service.match(/provider\.confirmPayment/g) ?? []

  assert.equal(providerConfirmCalls.length, 1)
  assert.match(runtime, /providerReferenceObserved/)
  assert.match(runtime, /providerOrderObserved/)
  assert.match(runtime, /providerStatusObserved/)
  assert.match(runtime, /confirmationTimestampObserved/)
  assert.match(runtime, /provider_runtime_complete/)
  assert.match(runtime, /provider_runtime_partial/)
  assert.match(runtime, /provider_runtime_incomplete/)
  assert.doesNotMatch(runtime, /confirmPayment\(/)
  assert.doesNotMatch(runtime, /markPaymentSucceededIfPending/)
})
