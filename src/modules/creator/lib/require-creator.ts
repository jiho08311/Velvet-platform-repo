import type { AuthSession } from "@/modules/auth/types"

export type CreatorInfo = {
  id: string
  profileId: string
  subscriptionPrice: number
  isVerified: boolean
  headline?: string
}

export type RequireCreatorOptions = {
  userId?: string
  session?: AuthSession | null
  getCreatorByUserId?: (userId: string) => Promise<CreatorInfo | null>
}

export async function requireCreator(
  options: RequireCreatorOptions
): Promise<CreatorInfo> {
  const userId = options.userId ?? options.session?.userId ?? null

  if (!userId) {
    throw new Error("Authentication required")
  }

  const creator = options.getCreatorByUserId
    ? await options.getCreatorByUserId(userId)
    : null

  if (!creator) {
    throw new Error("Creator access required")
  }

  return creator
}
