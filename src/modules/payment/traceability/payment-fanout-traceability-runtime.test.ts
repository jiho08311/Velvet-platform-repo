import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523001100_wave_010_fel_br_011_payment_fanout_traceability.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/payment-fanout-traceability-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/canonical-payment-fanout-traceability-repository.ts"
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

test("FEL-BR-011 introduces additive payment fanout lineage topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_payment_side_effect_lineage/)
  assert.match(sql, /create table if not exists public\.canonical_payment_fanout_events/)
  assert.match(sql, /create table if not exists public\.canonical_payment_fanout_ordering/)
  assert.match(sql, /side_effect_kind text not null/)
  assert.match(sql, /fanout_sequence integer not null/)
  assert.match(sql, /replay_timestamp_source text not null/)
  assert.match(sql, /provenance_metadata jsonb not null default '\{\}'::jsonb/)
})

test("FEL-BR-011 schema is additive, rollback-safe, and non-authoritative", () => {
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
  assert.match(sql, /replay_owned_execution_allowed boolean not null default false/)
  assert.match(sql, /reconciliation_repair_allowed boolean not null default false/)
  assert.doesNotMatch(sql, /\bdrop column\b/i)
  assert.doesNotMatch(sql, /\bdrop table\b/i)
  assert.doesNotMatch(sql, /\bdelete from public\./i)
  assert.doesNotMatch(sql, /\btruncate table\b/i)
  assert.doesNotMatch(sql, /\brename column\b/i)
  assert.doesNotMatch(sql, /\brename to\b/i)
  assert.doesNotMatch(sql, /\balter table public\.payments\b/i)
  assert.doesNotMatch(sql, /\balter table public\.subscriptions\b/i)
  assert.doesNotMatch(sql, /\balter table public\.earnings\b/i)
})

test("FEL-BR-011 runtime is feature-gated, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const service = read(PAYMENT_CONFIRMATION_SERVICE_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /WAVE_010_PAYMENT_FANOUT_TRACEABILITY_KILL_SWITCH/)
  assert.match(flags, /isWave010PaymentFanoutTraceabilityEnabled/)
  assert.match(runtime, /isWave010PaymentFanoutTraceabilityEnabled/)
  assert.match(runtime, /synchronizePaymentFanoutTraceabilityNoThrow/)
  assert.match(service, /synchronizePaymentFanoutTraceabilityNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /writeCanonicalPaymentFanoutTraceabilityNoThrow/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-011 preserves runtime fanout authority and forbids replay execution", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const service = read(PAYMENT_CONFIRMATION_SERVICE_PATH)

  assert.match(service, /upsertSubscription/)
  assert.match(service, /createEarning/)
  assert.match(service, /createNotification/)
  assert.match(repository, /paymentConfirmationRuntimeAuthorityPreserved: true/)
  assert.match(repository, /subscriptionActivationRuntimeAuthorityPreserved: true/)
  assert.match(repository, /earningCreationRuntimeAuthorityPreserved: true/)
  assert.match(repository, /projectionFirstRoutingAllowed: false/)
  assert.match(repository, /replayOwnedExecutionAllowed: false/)
  assert.match(repository, /entitlementAuthorityPromotionAllowed: false/)
  assert.match(runtime, /replayOwnedExecutionAllowed: false/)
  assert.match(runtime, /projectionFirstRoutingAllowed: false/)
  assert.match(runtime, /entitlementAuthorityPromotionAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("payments"\)/)
  assert.doesNotMatch(runtime, /\.from\("subscriptions"\)/)
  assert.doesNotMatch(runtime, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payments"\)/)
  assert.doesNotMatch(repository, /\.from\("subscriptions"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
  assert.doesNotMatch(service, /\.from\("canonical_payment_fanout_events"\)/)
})

test("FEL-BR-011 preserves existing payment fanout ordering", () => {
  const service = read(PAYMENT_CONFIRMATION_SERVICE_PATH)

  const subscription = service.indexOf("await activateSubscriptionFromPayment")
  const settlement = service.indexOf("const settlementResult = await processSettlement")
  const targetNormalization = service.indexOf("await setPaymentTargetType")
  const notification = service.indexOf("const notificationResult = await notifyPaymentSideEffects")

  assert.ok(subscription > -1)
  assert.ok(settlement > subscription)
  assert.ok(targetNormalization > settlement)
  assert.ok(notification > targetNormalization)
  assert.match(service, /fanoutSequence: 10/)
  assert.match(service, /fanoutSequence: 20/)
  assert.match(service, /fanoutSequence: 30/)
  assert.match(service, /fanoutSequence: 40/)
})

test("FEL-BR-011 exposes advisory blockers without runtime repair authority", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /payment_fanout_ordering_drift_detected/)
  assert.match(runtime, /payment_side_effect_lineage_missing/)
  assert.match(runtime, /payment_replay_safe_fanout_gap_detected/)
  assert.match(runtime, /payment_to_subscription_lineage_divergence_detected/)
  assert.match(runtime, /payment_to_earning_lineage_divergence_detected/)
  assert.match(runtime, /replay_owned_side_effect_execution_detected/)
  assert.match(runtime, /payment_fanout_authority_contamination_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /repair/i)
  assert.doesNotMatch(runtime, /executePayment/)
  assert.doesNotMatch(runtime, /mutateSubscription/)
})
