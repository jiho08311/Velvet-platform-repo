// src/modules/identity/contracts/creator-authority-contract.ts
import type { IdentityActor } from "./identity-actor"

export type CreatorLifecycleState =
  | "pending"
  | "active"
  | "suspended"
  | "banned"
  | "inactive"

export type CreatorVisibilityState =
  | "not_public"
  | "public_candidate"

export type CreatorModerationState =
  | "not_evaluated"

export type CreatorOperationalState =
  | "active"

export type CreatorReadinessState =
  | "promoted"

export type CreatorAuthority = {
  creatorId: string
  profileId: string
  userId: string
  username: string | null
  displayName: string | null
  lifecycleState: CreatorLifecycleState
  visibilityState: CreatorVisibilityState
  moderationState: CreatorModerationState | null
  operationalState: CreatorOperationalState | null
  readinessState: CreatorReadinessState | null
}

export type CreatorAuthorityTransitionContext = {
  actor: IdentityActor
  reason: string
  occurredAt: string
  correlationId?: string
}