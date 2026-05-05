import {
  canViewPost,
  type CanViewPostInput,
} from "@/modules/post/policies/post-visibility-policy"
import type { PostAccessLockReason, PostAccessResult } from "../types"

export type ResolvePostAccessPolicyInput = {
  viewerUserId: string | null | undefined
  creatorUserId: string | null | undefined
  visibility: "public" | "subscribers" | "paid"
  isSubscribed: boolean
  hasPurchased?: boolean
}

export function resolvePostAccessPolicy(
  input: ResolvePostAccessPolicyInput
): PostAccessResult {
  const canView = canViewPost({
    viewerUserId: input.viewerUserId,
    creatorUserId: input.creatorUserId,
    visibility: input.visibility,
    isSubscribed: input.isSubscribed,
    hasPurchased: input.hasPurchased,
  } satisfies CanViewPostInput)

  const lockReason: PostAccessLockReason = canView
    ? "none"
    : input.visibility === "paid"
      ? "purchase"
      : input.visibility === "subscribers"
        ? "subscription"
        : "none"

  return {
    canView,
    isLocked: !canView,
    lockReason,
  }
}