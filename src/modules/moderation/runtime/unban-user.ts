import { recordOperationalAudit } from "@/modules/governance/public/audit-contract"
import { unbanModerationUser } from "@/modules/moderation/repositories/moderation-user-write-repository"

type UnbanUserParams = {
  userId: string
  actorId?: string | null
  reason?: string | null
}

export type UnbannedUser = {
  id: string
  banned: boolean
  bannedAt: string | null
}

export async function unbanUser({
  userId,
  actorId = null,
  reason = null,
}: UnbanUserParams): Promise<UnbannedUser> {
  const data = await unbanModerationUser(userId)

  await recordOperationalAudit({
    actorId,
    action: "account_restored",
    targetType: "user",
    targetId: userId,
    metadata: {
      reason,
      restoredAt: new Date().toISOString(),
      source: "moderation.unbanUser",
    },
  })

  return {
    id: data.id,
    banned: data.banned,
    bannedAt: data.banned_at,
  }
}