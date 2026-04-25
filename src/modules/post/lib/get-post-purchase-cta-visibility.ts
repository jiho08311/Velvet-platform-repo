import type {
  PostAccessResult,
  PostPurchaseEligibility,
} from "../types"

type GetPostPurchaseCtaVisibilityInput =
  | {
      isLocked: boolean
      purchaseEligibility: PostPurchaseEligibility
    }
  | Pick<PostAccessResult, "canView" | "locked" | "lockReason">

export function getPostPurchaseCtaVisibility(
  input: GetPostPurchaseCtaVisibilityInput
): boolean {
  if ("purchaseEligibility" in input) {
    if (!input.isLocked) {
      return false
    }

    return input.purchaseEligibility.canPurchase
  }

  if (input.canView) {
    return false
  }

  if (!input.locked) {
    return false
  }

  return input.lockReason === "purchase"
}
