import { checkCanonicalCreatorAccess } from "@/modules/commerce/internal/adapters/entitlement-adapter"
import type {
  CanAccessCreatorInput,
  EntitlementAccessResult,
} from "@/modules/commerce/public/entitlement-contract"

export async function canAccessCreatorUseCase(
  input: CanAccessCreatorInput
): Promise<EntitlementAccessResult> {
  if (!input.viewerUserId) {
    return {
      decision: {
        allowed: false,
        subject: {
          type: "creator",
          creatorId: input.creatorId,
        },
        source: "none",
        reason: "unauthenticated",
        expiresAt: null,
      },
    }
  }

  const allowed = await checkCanonicalCreatorAccess({
    viewerUserId: input.viewerUserId,
    creatorId: input.creatorId,
  })

  return {
    decision: {
      allowed,
      subject: {
        type: "creator",
        creatorId: input.creatorId,
      },
      source: allowed ? "subscription" : "none",
      reason: allowed ? "active_subscription" : "not_subscribed",
      expiresAt: null,
    },
  }
}