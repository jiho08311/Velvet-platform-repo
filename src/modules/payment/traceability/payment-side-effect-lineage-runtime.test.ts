import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523002100_wave_010_fel_br_021_payment_side_effect_lineage_introduction.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/payment-side-effect-lineage-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/payment/canonical-side-effect-reconstruction-repository.ts"
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

test("FEL-BR-021 introduces additive side-effect reconstruction metadata only", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(
    sql,
    /create table if not exists public\.canonical_side_effect_reconstruction_metadata/
  )
  assert.match(sql, /side_effect_reconstruction_key text not null unique/)
  assert.match(sql, /fanout_event_key text not null/)
  assert.match(sql, /side_effect_lineage_key text not null/)
  assert.match(sql, /fanout_ordering_key text not null/)
  assert.match(sql, /reconstruction_confidence text not null/)
  assert.match(sql, /replay_safe_reconstructable boolean not null default false/)
  assert.doesNotMatch(sql, /create table if not exists public\.canonical_payment_side_effect_lineage/)
  assert.doesNotMatch(sql, /create table if not exists public\.canonical_payment_fanout_events/)
  assert.doesNotMatch(sql, /create table if not exists public\.canonical_payment_fanout_ordering/)
})

test("FEL-BR-021 schema is rollback-safe and non-serving", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /replay_owned_execution_allowed boolean not null default false/)
  assert.match(sql, /reconciliation_repair_allowed boolean not null default false/)
  assert.match(sql, /entitlement_authority_promotion_allowed boolean not null default false/)
  assert.match(sql, /replay_side_effect_executed boolean not null default false/)
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
  assert.doesNotMatch(sql, /\balter table public\.subscriptions\b/i)
  assert.doesNotMatch(sql, /\balter table public\.earnings\b/i)
  assert.doesNotMatch(sql, /\balter table public\.notifications\b/i)
})

test("FEL-BR-021 runtime is feature-gated, kill-switchable, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const service = read(PAYMENT_CONFIRMATION_SERVICE_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /WAVE_010_PAYMENT_SIDE_EFFECT_LINEAGE_KILL_SWITCH/)
  assert.match(flags, /isWave010PaymentSideEffectLineageEnabled/)
  assert.match(runtime, /isWave010PaymentSideEffectLineageEnabled/)
  assert.match(runtime, /synchronizePaymentSideEffectLineageNoThrow/)
  assert.match(service, /synchronizePaymentSideEffectLineageNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /writeCanonicalSideEffectReconstructionNoThrow/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-021 preserves runtime side-effect authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const service = read(PAYMENT_CONFIRMATION_SERVICE_PATH)

  assert.match(service, /upsertSubscription/)
  assert.match(service, /createEarning/)
  assert.match(service, /createNotification/)
  assert.match(repository, /subscriptionAuthorityPreserved: true/)
  assert.match(repository, /earningAuthorityPreserved: true/)
  assert.match(repository, /notificationAuthorityPreserved: true/)
  assert.match(repository, /replayOwnedExecutionAllowed: false/)
  assert.match(repository, /entitlementAuthorityPromotionAllowed: false/)
  assert.match(runtime, /paymentRuntimeReplayed: false/)
  assert.match(runtime, /sideEffectRuntimeReplayed: false/)
  assert.match(runtime, /replaySideEffectExecuted: false/)
  assert.match(runtime, /replayOwnedExecutionAllowed: false/)
  assert.match(runtime, /entitlementAuthorityPromotionAllowed: false/)
  assert.doesNotMatch(runtime, /\.from\("payments"\)/)
  assert.doesNotMatch(runtime, /\.from\("subscriptions"\)/)
  assert.doesNotMatch(runtime, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payments"\)/)
  assert.doesNotMatch(repository, /\.from\("subscriptions"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("notifications"\)/)
  assert.doesNotMatch(service, /\.from\("canonical_side_effect_reconstruction_metadata"\)/)
})

test("FEL-BR-021 observes fanout after legacy side effects and preserves ordering", () => {
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

test("FEL-BR-021 exposes advisory promotion blockers only", () => {
  const runtime = read(RUNTIME_PATH)

  assert.match(runtime, /side_effect_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_fanout_gap_detected/)
  assert.match(runtime, /side_effect_lineage_missing/)
  assert.match(runtime, /orphaned_earning_linkage_detected/)
  assert.match(runtime, /replay_owned_side_effect_execution_detected/)
  assert.match(runtime, /side_effect_authority_contamination_detected/)
  assert.match(runtime, /entitlement_authority_promotion_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /executePayment/)
  assert.doesNotMatch(runtime, /mutateSubscription/)
  assert.doesNotMatch(runtime, /createEarning/)
  assert.doesNotMatch(runtime, /createNotification/)
})
