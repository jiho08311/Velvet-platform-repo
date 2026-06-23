export type ModerationUserWriteRow = {
  id: string
  banned: boolean
  banned_at: string | null
}

export async function banModerationUser(
  userId: string,
  bannedAt: string
): Promise<ModerationUserWriteRow> {
  return {
    id: userId,
    banned: true,
    banned_at: bannedAt,
  }
}

export async function unbanModerationUser(
  userId: string
): Promise<ModerationUserWriteRow> {
  return {
    id: userId,
    banned: false,
    banned_at: null,
  }
}