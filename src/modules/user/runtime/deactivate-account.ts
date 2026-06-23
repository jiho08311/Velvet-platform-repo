import { canDeleteAccount } from "@/modules/authorization/public"
import {
  expireCreatorSubscriptions,
  expireUserSubscriptions,
} from "@/modules/subscription/public/expire-subscriptions"
import { executeAccountDeactivation } from "@/modules/identity/public/account-deactivation"
import { readCreatorIdentityByUserId } from "@/modules/identity/public/read-creator-identity"

export async function deactivateAccount(userId: string) {
const permission = await canDeleteAccount({
  actorId: userId,
  targetUserId: userId,
})

if (!permission.allowed) {
  throw new Error("Super admin accounts cannot be deactivated")
}

  const creator = await readCreatorIdentityByUserId(userId)

  await executeAccountDeactivation({
    profileId: userId,
  })

  if (creator?.id) {
    await expireCreatorSubscriptions({
      creatorIds: [creator.id],
      canceledAt: new Date().toISOString(),
    })
  }

  await expireUserSubscriptions({
    userId,
    canceledAt: new Date().toISOString(),
  })
}