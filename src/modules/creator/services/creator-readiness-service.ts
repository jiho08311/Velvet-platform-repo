// src/modules/creator/services/creator-readiness-service.ts

import {
  hasCreator,
  isCreatorActive,
} from "@/modules/creator/policies/creator-readiness-policy"

type CreatorWithStatus = {
  status: string
}

export type CreatorReadinessBlockReason = "creator_required"

export type CreatorOperationalReadinessBlockReason =
  | "creator_required"
  | "creator_not_active"

export function buildCreatorReadinessResult<TCreator>(
  creator: TCreator | null
):
  | {
      ok: true
      creator: TCreator
    }
  | {
      ok: false
      reason: CreatorReadinessBlockReason
    } {
  if (!hasCreator(creator)) {
    return {
      ok: false,
      reason: "creator_required",
    }
  }

  return {
    ok: true,
    creator,
  }
}

export function buildCreatorOperationalReadinessResult<
  TCreator extends CreatorWithStatus,
>(
  creator: TCreator | null
):
  | {
      ok: true
      creator: TCreator
    }
  | {
      ok: false
      reason: "creator_required"
    }
  | {
      ok: false
      reason: "creator_not_active"
      creator: TCreator
    } {
  if (!hasCreator(creator)) {
    return {
      ok: false,
      reason: "creator_required",
    }
  }

  if (!isCreatorActive(creator.status)) {
    return {
      ok: false,
      reason: "creator_not_active",
      creator,
    }
  }

  return {
    ok: true,
    creator,
  }
}