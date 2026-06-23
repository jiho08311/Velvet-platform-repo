import { readCreatorAuthorityByUserId } from "@/modules/identity/repositories/creator-authority-repository"

export const PUBLIC_CONTRACT = true

export type CreatorIdentity = {
  id: string
  userId: string
}

export async function readCreatorIdentityByUserId(
  userId: string,
): Promise<CreatorIdentity | null> {
  const { data: canonical, error } = await readCreatorAuthorityByUserId(userId)

  if (error) throw error

  if (!canonical?.creator_id || !canonical?.user_id) {
    return null
  }

  return {
    id: canonical.creator_id,
    userId: canonical.user_id,
  }
}
