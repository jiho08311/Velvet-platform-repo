import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523003000_wave_010_fel_br_030_canonical_entitlement_event_introduction.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/entitlement/entitlement-event-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/entitlement/canonical-entitlement-event-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/entitlement/feature-flags.ts"
)
const INDEX_PATH = join(
  process.cwd(),
  "src/shared/canonical/entitlement/index.ts"
)
const SUBSCRIPTION_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/subscription/runtime/get-viewer-subscription.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-030 introduces additive canonical entitlement event topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_entitlement_event/)
  assert.match(sql, /create table if not exists public\.canonical_entitlement_ordering/)
  assert.match(sql, /create table if not exists public\.canonical_entitlement_provenance/)
  assert.match(sql, /create table if not exists public\.canonical_entitlement_reconstruction_metadata/)
  assert.match(sql, /entitlement_event_key text not null unique/)
  assert.match(sql, /entitlement_ordering_key text not null unique/)
  assert.match(sql, /entitlement_provenance_key text not null unique/)
  assert.match(sql, /entitlement_reconstruction_key text not null unique/)
})

test("FEL-BR-030 schema preserves subscription and entitlement runtime authority", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /subscription_runtime_authoritative boolean not null default true/)
  assert.match(sql, /entitlement_runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /replay_authoritative boolean not null default false/)
  assert.match(sql, /reconciliation_authoritative boolean not null default false/)
  assert.match(sql, /projection_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /replay_owned_entitlement_mutation_allowed boolean not null default false/)
  assert.match(sql, /replay_owned_execution_allowed boolean not null default false/)
  assert.match(sql, /entitlement_mutation_allowed boolean not null default false/)
  assert.match(sql, /entitlement_authority_promotion_allowed boolean not null default false/)
  assert.match(sql, /subscription_serving_replacement_allowed boolean not null default false/)
  assert.match(sql, /projection_entitlement_authority_allowed boolean not null default false/)
  assert.match(sql, /runtime_authority_transfer_allowed boolean not null default false/)
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
})

test("FEL-BR-030 runtime is feature-gated, exported, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const index = read(INDEX_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /W10_OBSERVABILITY_ENABLED/)
  assert.match(flags, /WAVE_010_CANONICAL_ENTITLEMENT_EVENT_KILL_SWITCH/)
  assert.match(flags, /isWave010CanonicalEntitlementEventEnabled/)
  assert.match(runtime, /synchronizeCanonicalEntitlementEventNoThrow/)
  assert.match(runtime, /validateCanonicalEntitlementEventReadiness/)
  assert.match(repository, /writeCanonicalEntitlementEventNoThrow/)
  assert.match(index, /synchronizeCanonicalEntitlementEventNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-030 connects after runtime subscription validation without changing return shape", () => {
  const subscriptionRuntime = read(SUBSCRIPTION_RUNTIME_PATH)

  assert.match(subscriptionRuntime, /synchronizeCanonicalEntitlementEventNoThrow/)
  assert.match(subscriptionRuntime, /runtimeResult: "subscription_absent"/)
  assert.match(subscriptionRuntime, /runtimeResult: "subscription_read_model_absent"/)
  assert.match(subscriptionRuntime, /runtimeResult: "subscription_read_model_observed"/)
  assert.match(subscriptionRuntime, /return result/)
  assert.match(subscriptionRuntime, /isActive: readModel\.hasAccess/)
  assert.doesNotMatch(subscriptionRuntime, /canonicalAuthoritative/)
  assert.doesNotMatch(subscriptionRuntime, /promoteEntitlementAuthority/)
})

test("FEL-BR-030 repository writes only canonical entitlement topology", () => {
  const repository = read(REPOSITORY_PATH)

  assert.match(repository, /\.from\("canonical_entitlement_event"\)/)
  assert.match(repository, /\.from\("canonical_entitlement_ordering"\)/)
  assert.match(repository, /\.from\("canonical_entitlement_provenance"\)/)
  assert.match(repository, /\.from\("canonical_entitlement_reconstruction_metadata"\)/)
  assert.doesNotMatch(repository, /\.from\("subscriptions"\)/)
  assert.doesNotMatch(repository, /\.from\("payments"\)/)
  assert.doesNotMatch(repository, /\.from\("shadow_entitlement_nodes"\)/)
  assert.doesNotMatch(repository, /\.from\("shadow_entitlement_edges"\)/)
})

test("FEL-BR-030 exposes blockers without replay or projection entitlement authority", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)

  assert.match(repository, /runtimeAuthoritative: true/)
  assert.match(repository, /subscriptionRuntimeAuthoritative: true/)
  assert.match(repository, /entitlementRuntimeAuthoritative: true/)
  assert.match(repository, /canonicalAuthoritative: false/)
  assert.match(repository, /servingAuthoritative: false/)
  assert.match(repository, /replayOwnedEntitlementMutationAllowed: false/)
  assert.match(repository, /entitlementAuthorityPromotionAllowed: false/)
  assert.match(repository, /projectionEntitlementAuthorityAllowed: false/)
  assert.match(runtime, /entitlement_lineage_divergence_detected/)
  assert.match(runtime, /entitlement_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_entitlement_gap_detected/)
  assert.match(runtime, /subscription_lineage_mismatch_detected/)
  assert.match(runtime, /missing_entitlement_lineage_detected/)
  assert.match(runtime, /replay_owned_entitlement_mutation_detected/)
  assert.match(runtime, /entitlement_authority_contamination_detected/)
  assert.match(runtime, /projection_owned_entitlement_authority_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /mutateEntitlement/)
  assert.doesNotMatch(runtime, /repairEntitlement/)
  assert.doesNotMatch(runtime, /promoteEntitlementAuthority/)
})
