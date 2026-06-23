import { checkCanonicalPostPurchase } from "@/modules/commerce/internal/adapters/entitlement-adapter"
import type {
  CanAccessPostInput,
  EntitlementAccessResult,
} from "@/modules/commerce/public/entitlement-contract"

export async function canAccessPostUseCase(
  input: CanAccessPostInput
): Promise<EntitlementAccessResult> {
  if (!input.viewerUserId) {
    return {
      decision: {
        allowed: false,
        subject: {
          type: "post",
          postId: input.postId,
        },
        source: "none",
        reason: "unauthenticated",
        expiresAt: null,
      },
    }
  }

  const purchased = await checkCanonicalPostPurchase({
    viewerUserId: input.viewerUserId,
    postId: input.postId,
  })

  return {
    decision: {
      allowed: purchased,
      subject: {
        type: "post",
        postId: input.postId,
      },
      source: purchased ? "payment" : "none",
      reason: purchased ? "purchased" : "not_purchased",
      expiresAt: null,
    },
  }
}