import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523003100_wave_010_fel_br_031_subscription_validation_boundary_isolation.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/validation/subscription-validation-boundary-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/validation/canonical-validation-boundary-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/validation/feature-flags.ts"
)
const INDEX_PATH = join(
  process.cwd(),
  "src/shared/canonical/validation/index.ts"
)
const CHECK_SUBSCRIPTION_PATH = join(
  process.cwd(),
  "src/modules/subscription/runtime/check-subscription.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-031 introduces additive canonical validation boundary topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_validation_event/)
  assert.match(sql, /create table if not exists public\.canonical_validation_lineage/)
  assert.match(sql, /create table if not exists public\.canonical_validation_ordering/)
  assert.match(sql, /create table if not exists public\.canonical_validation_provenance/)
  assert.match(sql, /create table if not exists public\.canonical_validation_reconstruction_metadata/)
  assert.match(sql, /validation_event_key text not null unique/)
  assert.match(sql, /validation_lineage_key text not null unique/)
  assert.match(sql, /validation_ordering_key text not null unique/)
  assert.match(sql, /validation_provenance_key text not null unique/)
  assert.match(sql, /validation_reconstruction_key text not null unique/)
})

test("FEL-BR-031 schema preserves validation and entitlement runtime authority", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /validation_runtime_authoritative boolean not null default true/)
  assert.match(sql, /entitlement_runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /replay_authoritative boolean not null default false/)
  assert.match(sql, /reconciliation_authoritative boolean not null default false/)
  assert.match(sql, /projection_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /replay_owned_validation_mutation_allowed boolean not null default false/)
  assert.match(sql, /replay_owned_execution_allowed boolean not null default false/)
  assert.match(sql, /validation_mutation_allowed boolean not null default false/)
  assert.match(sql, /validation_authority_transfer_allowed boolean not null default false/)
  assert.match(sql, /projection_entitlement_authority_allowed boolean not null default false/)
  assert.match(sql, /runtime_validation_replacement_allowed boolean not null default false/)
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

test("FEL-BR-031 runtime is feature-gated, exported, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const index = read(INDEX_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /W10_OBSERVABILITY_ENABLED/)
  assert.match(flags, /WAVE_010_SUBSCRIPTION_VALIDATION_BOUNDARY_KILL_SWITCH/)
  assert.match(flags, /isWave010SubscriptionValidationBoundaryEnabled/)
  assert.match(runtime, /synchronizeSubscriptionValidationBoundaryNoThrow/)
  assert.match(runtime, /validateSubscriptionValidationBoundaryReadiness/)
  assert.match(repository, /writeCanonicalValidationBoundaryNoThrow/)
  assert.match(index, /synchronizeSubscriptionValidationBoundaryNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-031 observes checkSubscription after runtime validation without changing result", () => {
  const checkSubscription = read(CHECK_SUBSCRIPTION_PATH)

  assert.match(checkSubscription, /synchronizeSubscriptionValidationBoundaryNoThrow/)
  assert.match(checkSubscription, /const viewerSubscription = await getViewerSubscription/)
  assert.match(checkSubscription, /accessGranted: viewerSubscription\.isActive/)
  assert.match(checkSubscription, /return viewerSubscription\.isActive/)
  assert.doesNotMatch(checkSubscription, /canonicalAuthoritative/)
  assert.doesNotMatch(checkSubscription, /promoteValidationAuthority/)
})

test("FEL-BR-031 repository writes only canonical validation boundary tables", () => {
  const repository = read(REPOSITORY_PATH)

  assert.match(repository, /\.from\("canonical_validation_event"\)/)
  assert.match(repository, /\.from\("canonical_validation_lineage"\)/)
  assert.match(repository, /\.from\("canonical_validation_ordering"\)/)
  assert.match(repository, /\.from\("canonical_validation_provenance"\)/)
  assert.match(repository, /\.from\("canonical_validation_reconstruction_metadata"\)/)
  assert.doesNotMatch(repository, /\.from\("subscriptions"\)/)
  assert.doesNotMatch(repository, /\.from\("canonical_entitlement_event"\)/)
  assert.doesNotMatch(repository, /\.from\("shadow_entitlement_nodes"\)/)
})

test("FEL-BR-031 exposes blockers without validation authority transfer", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)

  assert.match(repository, /runtimeAuthoritative: true/)
  assert.match(repository, /validationRuntimeAuthoritative: true/)
  assert.match(repository, /entitlementRuntimeAuthoritative: true/)
  assert.match(repository, /canonicalAuthoritative: false/)
  assert.match(repository, /servingAuthoritative: false/)
  assert.match(repository, /replayOwnedValidationMutationAllowed: false/)
  assert.match(repository, /validationAuthorityTransferAllowed: false/)
  assert.match(repository, /projectionEntitlementAuthorityAllowed: false/)
  assert.match(repository, /runtimeValidationReplacementAllowed: false/)
  assert.match(runtime, /validation_lineage_divergence_detected/)
  assert.match(runtime, /validation_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_validation_gap_detected/)
  assert.match(runtime, /validation_isolation_mismatch_detected/)
  assert.match(runtime, /unauthorized_validation_mutation_detected/)
  assert.match(runtime, /replay_owned_validation_mutation_detected/)
  assert.match(runtime, /projection_owned_entitlement_authority_detected/)
  assert.match(runtime, /validation_authority_contamination_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /mutateValidation/)
  assert.doesNotMatch(runtime, /repairValidation/)
  assert.doesNotMatch(runtime, /promoteValidationAuthority/)
})
