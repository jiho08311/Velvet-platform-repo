import { recordOperationalAudit } from "@/modules/governance/public/audit-contract"
import { banModerationUser } from "@/modules/moderation/repositories/moderation-user-write-repository"

type BanUserParams = {
  userId: string
  actorId?: string | null
  reason?: string | null
}

export type BannedUser = {
  id: string
  banned: boolean
  bannedAt: string | null
}

export async function banUser({
  userId,
  actorId = null,
  reason = null,
}: BanUserParams): Promise<BannedUser> {
  const bannedAt = new Date().toISOString()

  const data = await banModerationUser(userId, bannedAt)

  await recordOperationalAudit({
    actorId,
    action: "account_suspended",
    targetType: "user",
    targetId: userId,
    metadata: {
      reason,
      bannedAt,
      source: "moderation.banUser",
    },
  })

  return {
    id: data.id,
    banned: data.banned,
    bannedAt: data.banned_at,
  }
}