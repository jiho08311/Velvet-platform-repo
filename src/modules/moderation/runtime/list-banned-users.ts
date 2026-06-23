import { listCanonicalBannedProfileRows } from "@/modules/moderation/repositories/banned-user-repository"

export type BannedUser = {
  id: string
  banned: boolean
  bannedAt: string | null
}

function stringMetadata(
  metadata: Record<string, unknown> | null,
  key: string
): string | null {
  const value = metadata?.[key]
  return typeof value === "string" ? value : null
}

export async function listBannedUsers(): Promise<BannedUser[]> {
  const rows = await listCanonicalBannedProfileRows()

  return rows.map((row) => ({
    id: row.profile_id,
    banned: row.profile_lifecycle_state === "banned",
    bannedAt: stringMetadata(row.aggregate_metadata, "bannedAt"),
  }))
}
