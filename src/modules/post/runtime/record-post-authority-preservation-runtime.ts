import {
  recordPostCutoverAuthorityPreservationEvent,
} from "@/modules/post/repositories/post-cutover-authority-repository"

export async function recordPostAuthorityPreservationRuntime(input: {
  aggregateOwner: string
  aggregateRoot: string
  domainName: string
  runtimeSurface: string
  authoritySurface: string
  authorityState: string
  authorityMode: string
  promotionAllowed: boolean
  rollbackSafe: boolean
  failOpen: boolean
  runtimeAuthoritative?: boolean
  projectionAuthoritative?: boolean
  governanceAuthoritative?: boolean
}) {
  const now = new Date().toISOString()

  return recordPostCutoverAuthorityPreservationEvent({
    row: {
      aggregate_owner: input.aggregateOwner,
      aggregate_root: input.aggregateRoot,
      domain_name: input.domainName,
      runtime_surface: input.runtimeSurface,
      authority_surface: input.authoritySurface,
      authority_state: input.authorityState,
      authority_mode: input.authorityMode,
      promotion_allowed: input.promotionAllowed,
      rollback_safe: input.rollbackSafe,
      fail_open: input.failOpen,
      runtime_authoritative: input.runtimeAuthoritative ?? false,
      projection_authoritative: input.projectionAuthoritative ?? false,
      governance_authoritative: input.governanceAuthoritative ?? false,
      observed_at: now,
    },
  })
}