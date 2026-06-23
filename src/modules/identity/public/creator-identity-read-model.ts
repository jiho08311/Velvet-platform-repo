import {
  readCreatorAuthorityByCreatorId,
  readCreatorAuthorityByUserId,
} from "@/modules/identity/repositories/creator-authority-repository"

export const PUBLIC_CONTRACT = true

export type CreatorIdentityReadModel = {
  id: string
  userId: string
  username: string | null
  displayName: string | null
}

function mapCreatorAuthority(row: {
  creator_id: string | null
  user_id: string | null
  username: string | null
  display_name: string | null
}): CreatorIdentityReadModel | null {
  if (!row.creator_id || !row.user_id) return null

  return {
    id: row.creator_id,
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
  }
}

export async function readCreatorIdentityByCreatorId(
  creatorId: string
): Promise<CreatorIdentityReadModel | null> {
  const { data, error } = await readCreatorAuthorityByCreatorId(creatorId)

  if (error) throw error

  return data ? mapCreatorAuthority(data) : null
}

export async function readCreatorIdentityByUserId(
  userId: string
): Promise<CreatorIdentityReadModel | null> {
  const { data, error } = await readCreatorAuthorityByUserId(userId)

  if (error) throw error

  return data ? mapCreatorAuthority(data) : null
}

export async function listCreatorIdentitiesByCreatorIds(
  creatorIds: string[]
): Promise<CreatorIdentityReadModel[]> {
  const uniqueIds = Array.from(new Set(creatorIds.filter(Boolean)))

  if (uniqueIds.length === 0) return []

  const rows = await Promise.all(
    uniqueIds.map((creatorId) => readCreatorIdentityByCreatorId(creatorId))
  )

  return rows.filter((row): row is CreatorIdentityReadModel => row != null)
}
