import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const SQL_PATH = join(
  process.cwd(),
  "docs/db-migration/briefs/wave-010-fel-br-076-manual-db-change-pack.sql"
)
const RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/entitlement/entitlement-sovereignty-preservation-runtime.ts"
)
const REPOSITORY_PATH = join(
  process.cwd(),
  "src/shared/canonical/entitlement/canonical-entitlement-sovereignty-preservation-repository.ts"
)
const FLAGS_PATH = join(
  process.cwd(),
  "src/shared/canonical/entitlement/feature-flags.ts"
)
const INDEX_PATH = join(
  process.cwd(),
  "src/shared/canonical/entitlement/index.ts"
)
const ENTITLEMENT_EVENT_RUNTIME_PATH = join(
  process.cwd(),
  "src/shared/canonical/entitlement/entitlement-event-runtime.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("FEL-BR-076 introduces additive canonical entitlement sovereignty preservation topology", () => {
  const sql = read(SQL_PATH)

  for (const table of [
    "canonical_entitlement_sovereignty_preservations",
    "canonical_entitlement_sovereignty_preservation_ordering",
    "canonical_entitlement_sovereignty_preservation_provenance",
    "canonical_entitlement_sovereignty_preservation_reconstruction_metadata",
  ]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`))
  }

  assert.match(
    sql,
    /entitlement_sovereignty_preservation_key text not null unique/
  )
  assert.match(
    sql,
    /entitlement_sovereignty_preservation_ordering_key text not null unique/
  )
  assert.match(
    sql,
    /entitlement_sovereignty_preservation_provenance_key text not null unique/
  )
  assert.match(
    sql,
    /entitlement_sovereignty_preservation_reconstruction_metadata_key text not null unique/
  )
})

test("FEL-BR-076 schema preserves entitlement authority and blocks forbidden surfaces", () => {
  const sql = read(SQL_PATH)

  assert.match(sql, /entitlement_runtime_authoritative boolean not null default true/)
  assert.match(sql, /subscription_runtime_authoritative boolean not null default true/)
  assert.match(sql, /governance_runtime_authoritative boolean not null default true/)
  assert.match(sql, /rollback_runtime_authoritative boolean not null default true/)
  assert.match(sql, /canonical_entitlement_authoritative boolean not null default false/)
  assert.match(sql, /governance_entitlement_execution_allowed boolean not null default false/)
  assert.match(sql, /replay_entitlement_mutation_allowed boolean not null default false/)
  assert.match(sql, /projection_entitlement_execution_allowed boolean not null default false/)
  assert.match(sql, /entitlement_runtime_replacement_allowed boolean not null default false/)
  assert.match(sql, /authority_transfer_allowed boolean not null default false/)
  assert.match(sql, /serving_authoritative boolean not null default false/)
  assert.match(sql, /authority_mode text not null default 'synchronized_candidate'/)
  assert.match(sql, /enforcement_mode text not null default 'none'/)
  assert.match(sql, /promotion_allowed boolean not null default false/)
  assert.match(sql, /rollback_safe boolean not null default true/)
  assert.match(sql, /fail_open boolean not null default true/)
  assert.doesNotMatch(sql, /\bdrop column\b/i)
  assert.doesNotMatch(sql, /^\s*drop table\b/im)
  assert.doesNotMatch(sql, /\bdelete from public\./i)
  assert.doesNotMatch(sql, /\btruncate table\b/i)
  assert.doesNotMatch(sql, /\brename\b/i)
})

test("FEL-BR-076 runtime is feature-gated, exported, no-throw, and fail-open", () => {
  const runtime = read(RUNTIME_PATH)
  const repository = read(REPOSITORY_PATH)
  const flags = read(FLAGS_PATH)
  const index = read(INDEX_PATH)

  assert.match(
    flags,
    /WAVE_010_ENTITLEMENT_SOVEREIGNTY_PRESERVATION_KILL_SWITCH/
  )
  assert.match(flags, /isWave010EntitlementSovereigntyPreservationEnabled/)
  assert.match(runtime, /synchronizeEntitlementSovereigntyPreservationNoThrow/)
  assert.match(runtime, /validateEntitlementSovereigntyPreservationReadiness/)
  assert.match(
    repository,
    /writeCanonicalEntitlementSovereigntyPreservationNoThrow/
  )
  assert.match(index, /synchronizeEntitlementSovereigntyPreservationNoThrow/)
  assert.match(runtime, /try \{/)
  assert.match(runtime, /catch \(error\)/)
  assert.match(repository, /catch \(error\)/)
  assert.doesNotMatch(runtime, /throw error/)
  assert.doesNotMatch(runtime, /throw new Error/)
})

test("FEL-BR-076 connects entitlement event runtime as advisory preservation only", () => {
  const entitlementEventRuntime = read(ENTITLEMENT_EVENT_RUNTIME_PATH)

  assert.match(
    entitlementEventRuntime,
    /synchronizeEntitlementSovereigntyPreservationNoThrow/
  )
  assert.match(
    entitlementEventRuntime,
    /sovereigntyBoundaryKey: "financial\.entitlement\.sovereignty_preservation"/
  )
  assert.match(entitlementEventRuntime, /entitlementRuntimeAuthorityPreserved: true/)
  assert.match(
    entitlementEventRuntime,
    /entitlementSovereigntyPreservationAdvisoryOnly: true/
  )
  assert.match(
    entitlementEventRuntime,
    /governanceEntitlementExecutionAllowed: false/
  )
  assert.match(entitlementEventRuntime, /replayEntitlementMutationAllowed: false/)
  assert.match(
    entitlementEventRuntime,
    /projectionEntitlementExecutionAllowed: false/
  )
  assert.doesNotMatch(entitlementEventRuntime, /executeEntitlementMutation/)
  assert.doesNotMatch(entitlementEventRuntime, /promoteEntitlementAuthority/)
  assert.doesNotMatch(entitlementEventRuntime, /replaceEntitlementRuntime/)
})

test("FEL-BR-076 repository writes only entitlement sovereignty preservation tables", () => {
  const repository = read(REPOSITORY_PATH)

  assert.match(
    repository,
    /\.from\("canonical_entitlement_sovereignty_preservations"\)/
  )
  assert.match(
    repository,
    /\.from\("canonical_entitlement_sovereignty_preservation_ordering"\)/
  )
  assert.match(
    repository,
    /\.from\("canonical_entitlement_sovereignty_preservation_provenance"\)/
  )
  assert.match(
    repository,
    /\.from\(\s*"canonical_entitlement_sovereignty_preservation_reconstruction_metadata"\s*\)/
  )
  assert.doesNotMatch(repository, /\.from\("payments"\)/)
  assert.doesNotMatch(repository, /\.from\("earnings"\)/)
  assert.doesNotMatch(repository, /\.from\("payouts"\)/)
  assert.doesNotMatch(repository, /\.from\("subscriptions"\)/)
})
