import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import { canAccessCreator } from "@/modules/commerce/public/entitlement-contract"

async function getOptionalCurrentUser() {
  try {
    return await getCurrentUser()
  } catch {
    return null
  }
}

export async function loadCreatorPageAccessData(input: {
  creatorId: string
  creatorUserId: string
}) {
  const user = await getOptionalCurrentUser()
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

  const isSubscribed = creatorAccess.decision.allowed

  return {
    isOwner: userId === input.creatorUserId,
    status: isSubscribed ? ("active" as const) : ("inactive" as const),
    isSubscribed,
    userId,
  }
}