// src/modules/identity/contracts/profile-authority-contract.ts
import type { IdentityActor } from "./identity-actor"

export type ProfileLifecycleState =
  | "active"
  | "deactivated"
  | "delete_pending"
  | "banned"

export type IdentityVisibilityState =
  | "visible"
  | "not_visible"

export type ProfileReadinessState =
  | "promoted"

export type ProfileAuthority = {
  profileId: string
  username: string | null
  displayName: string | null
  lifecycleState: ProfileLifecycleState
  visibilityState: IdentityVisibilityState
  readinessState: ProfileReadinessState | null
}

export type ProfileAuthorityTransitionContext = {
  actor: IdentityActor
  reason: string
  occurredAt: string
  correlationId?: string
}