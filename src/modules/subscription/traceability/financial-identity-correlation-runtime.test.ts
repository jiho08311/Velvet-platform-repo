import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260523003300_wave_010_fel_br_033_financial_identity_correlation.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/financial-identity/financial-identity-correlation-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/financial-identity/canonical-financial-identity-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/financial-identity/feature-flags.ts"
)
const INDEX_PATH = join(
  process.cwd(),
  "src/shared/canonical/financial-identity/index.ts"
)
const SUBSCRIPTION_CHECK_PATH = join(
  process.cwd(),
  "src/modules/subscription/runtime/check-subscription.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-033 introduces additive canonical financial identity topology", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /create table if not exists public\.canonical_financial_identity/)
  assert.match(sql, /create table if not exists public\.canonical_financial_identity_correlations/)
  assert.match(sql, /create table if not exists public\.canonical_financial_identity_ordering/)
  assert.match(sql, /create table if not exists public\.canonical_financial_ownership_provenance/)
  assert.match(sql, /create table if not exists public\.canonical_financial_identity_reconstruction_metadata/)
  assert.match(sql, /financial_identity_key text not null unique/)
  assert.match(sql, /identity_correlation_key text not null unique/)
  assert.match(sql, /identity_ordering_key text not null unique/)
  assert.match(sql, /ownership_provenance_key text not null unique/)
  assert.match(sql, /identity_reconstruction_key text not null unique/)
})

test("FEL-BR-033 schema preserves runtime identity and financial ownership authority", () => {
  const sql = read(MIGRATION_PATH)

  assert.match(sql, /runtime_authoritative boolean not null default true/)
  assert.match(sql, /runtime_identity_authoritative boolean not null default true/)
  assert.match(sql, /financial_ownership_runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_authoritative boolean not null default false/)
  assert.match(sql, /governance_authoritative boolean not null default false/)
  assert.match(sql, /replay_authoritative boolean not null default false/)
  assert.match(sql, /reconciliation_authoritative boolean not null default false/)
  assert.match(sql, /projection_authoritative boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /replay_owned_identity_mutation_allowed boolean not null default false/)
  assert.match(sql, /governance_identity_authority_allowed boolean not null default false/)
  assert.match(sql, /projection_ownership_authority_allowed boolean not null default false/)
  assert.match(sql, /runtime_identity_replacement_allowed boolean not null default false/)
  assert.match(sql, /entitlement_ownership_replacement_allowed boolean not null default false/)
  assert.match(sql, /runtime_authority_transfer_allowed boolean not null default false/)
  assert.match(sql, /authority_mode text not null default 'synchronized_candidate'/)
  assert.match(sql, /enforcement_mode text not null default 'none'/)
  assert.match(sql, /promotion_allowed boolean not null default false/)
  assert.match(sql, /rollback_safe boolean not null default true/)
  assert.match(sql, /fail_open boolean not null default true/)
  assert.doesNotMatch(sql, /\bdrop column\b/i)
  assert.doesNotMatch(sql, /\bdelete from public\./i)
  assert.doesNotMatch(sql, /\btruncate table\b/i)
  assert.doesNotMatch(sql, /\brename column\b/i)
  assert.doesNotMatch(sql, /\brename to\b/i)
  assert.doesNotMatch(sql, /\balter table public\.users\b/i)
  assert.doesNotMatch(sql, /\balter table public\.subscriptions\b/i)
  assert.doesNotMatch(sql, /\balter table public\.payments\b/i)
  assert.doesNotMatch(sql, /\balter table public\.earnings\b/i)
  assert.doesNotMatch(sql, /\balter table public\.payouts\b/i)
})

test("FEL-BR-033 runtime is feature-gated, exported, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const index = read(INDEX_PATH)

  assert.match(flags, /W10_DOMAIN_ENABLED/)
  assert.match(flags, /W10_SCHEMA_ENABLED/)
  assert.match(flags, /W10_DUAL_WRITE_ENABLED/)
  assert.match(flags, /W10_LINEAGE_ENABLED/)
  assert.match(flags, /W10_OBSERVABILITY_ENABLED/)
  assert.match(flags, /WAVE_010_FINANCIAL_IDENTITY_CORRELATION_KILL_SWITCH/)
  assert.match(flags, /isWave010FinancialIdentityCorrelationEnabled/)
  assert.match(runtime, /synchronizeFinancialIdentityCorrelationNoThrow/)
  assert.match(runtime, /validateFinancialIdentityCorrelationReadiness/)
  assert.match(repository, /writeCanonicalFinancialIdentityCorrelationNoThrow/)
  assert.match(index, /synchronizeFinancialIdentityCorrelationNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /catch \(error\)/)
  assert.match(repository, /console\.error/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-033 repository writes only canonical financial identity tables", () => {
  const repository = read(REPOSITORY_PATH)

  assert.match(repository, /\.from\("canonical_financial_identity"\)/)
  assert.match(repository, /\.from\("canonical_financial_identity_correlations"\)/)
  assert.match(repository, /\.from\("canonical_financial_identity_ordering"\)/)
  assert.match(repository, /\.from\("canonical_financial_ownership_provenance"\)/)
  assert.match(repository, /\.from\("canonical_financial_identity_reconstruction_metadata"\)/)
  assert.doesNotMatch(repository, /\.from\("users"\)/)
  assert.doesNotMatch(repository, /\.from\("subscriptions"\)/)
  assert.doesNotMatch(repository, /\.from\("payments"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payout_requests"\)/)
  assert.doesNotMatch(repository, /\.from\("payouts"\)/)
})

test("FEL-BR-033 observes subscription ownership without replacing identity authority", () => {
  const subscriptionCheck = read(SUBSCRIPTION_CHECK_PATH)

  assert.match(subscriptionCheck, /synchronizeFinancialIdentityCorrelationNoThrow/)
  assert.match(subscriptionCheck, /ownershipSurface: "subscription_ownership"/)
  assert.match(subscriptionCheck, /runtimeIdentityAuthorityPreserved: true/)
  assert.match(subscriptionCheck, /return viewerSubscription\.isActive/)
  assert.doesNotMatch(subscriptionCheck, /canonicalAuthoritative/)
  assert.doesNotMatch(subscriptionCheck, /replaceRuntimeIdentity/)
  assert.doesNotMatch(subscriptionCheck, /mutateEntitlementOwnership/)
})

test("FEL-BR-033 exposes promotion blockers without identity authority transfer", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)

  assert.match(repository, /runtimeIdentityAuthoritative: true/)
  assert.match(repository, /financialOwnershipRuntimeAuthoritative: true/)
  assert.match(repository, /canonicalAuthoritative: false/)
  assert.match(repository, /servingAuthoritative: false/)
  assert.match(repository, /replayOwnedIdentityMutationAllowed: false/)
  assert.match(repository, /governanceIdentityAuthorityAllowed: false/)
  assert.match(repository, /projectionOwnershipAuthorityAllowed: false/)
  assert.match(runtime, /identity_lineage_divergence_detected/)
  assert.match(runtime, /identity_ordering_drift_detected/)
  assert.match(runtime, /replay_safe_identity_gap_detected/)
  assert.match(runtime, /ownership_mismatch_detected/)
  assert.match(runtime, /orphaned_financial_actor_lineage_detected/)
  assert.match(runtime, /replay_owned_identity_mutation_detected/)
  assert.match(runtime, /governance_owned_identity_authority_detected/)
  assert.match(runtime, /projection_owned_ownership_authority_detected/)
  assert.match(runtime, /readinessState: blockers\.length > 0 \? "blocked" : "advisory_ready"/)
  assert.doesNotMatch(runtime, /promoteIdentityAuthority/)
  assert.doesNotMatch(runtime, /executeIdentityMutation/)
})
