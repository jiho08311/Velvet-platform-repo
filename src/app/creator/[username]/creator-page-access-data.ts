import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import { canAccessCreator } from "@/modules/commerce/public/entitlement-contract"

export async function loadCreatorPageAccessData(input: {
  creatorId: string
  creatorUserId: string
}) {
  const user = await getCurrentUser()
  const userId = user?.id ?? null

  const creatorAccess = userId
    ? await canAccessCreator({
        viewerUserId: userId,
        creatorId: input.creatorId,
      })
    : {
        decision: {
          allowed: false,
          reason: "unauthenticated" as const,
        },
      }

  return {
    isOwner: userId === input.creatorUserId,
    status: creatorAccess.decision.allowed
      ? ("active" as const)
      : ("inactive" as const),
    userId,
  }
}
