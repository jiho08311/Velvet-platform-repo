// src/modules/creator/policies/creator-readiness-policy.ts

type CreatorStatus = string | null | undefined

type CreatorLifecycleState =
  | "pending"
  | "active"
  | "suspended"
  | "inactive"
  | "banned"

export function hasCreator<TCreator>(
  creator: TCreator | null | undefined
): creator is TCreator {
  return Boolean(creator)
}

export function isCreatorActive(
  status: CreatorStatus,
  creatorLifecycleState?: CreatorLifecycleState | string | null
): boolean {
  if (creatorLifecycleState) {
    return creatorLifecycleState === "active"
  }

  return status === "active"
}