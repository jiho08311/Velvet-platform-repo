import { requireAdmin } from "@/modules/admin/public/require-admin"
import { toAdminPaymentItem } from "@/modules/payment/mappers/payment-read-model-mapper"
import { listAdminPaymentRows } from "@/modules/payment/repositories/payment-read-repository"
import { listCreatorIdentitiesByCreatorIds } from "@/modules/identity/public/creator-identity-read-model"
import { listAdminPaymentProfileRowsByIds } from "@/modules/payment/repositories/admin-payment-profile-repository"

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
}

export type AdminPaymentItem = {
  id: string
  amount: number
  currency: string
  status: "succeeded" | "pending" | "failed" | "refunded"
  paymentType: "subscription" | "tip" | "ppv_post" | "ppv_message" | "unknown"
  createdAt: string
  user: {
    username: string
    displayName: string
  } | null
  creator: {
    username: string
    displayName: string
  } | null
}

export async function listPayments(): Promise<AdminPaymentItem[]> {
  await requireAdmin()

  const rows = await listAdminPaymentRows()

  const userIds = Array.from(
    new Set(rows.map((row) => row.user_id).filter(Boolean)),
  ) as string[]

  const creatorIds = Array.from(
    new Set(rows.map((row) => row.creator_id).filter(Boolean)),
  ) as string[]

  const [users, creators] = await Promise.all([
    listAdminPaymentProfileRowsByIds(userIds),
    listCreatorIdentitiesByCreatorIds(creatorIds),
  ])

  const userMap = new Map<string, ProfileRow>(
    users.map((user) => [
      user.id,
      {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
      },
    ]),
  )

  const creatorMap = new Map(
    creators.map((creator) => [
      creator.id,
      {
        id: creator.id,
        user_id: creator.userId,
        username: creator.username,
        display_name: creator.displayName,
      },
    ]),
  )

  return rows.map((row) =>
    toAdminPaymentItem({
      row,
      user: row.user_id ? userMap.get(row.user_id) ?? null : null,
      creator: row.creator_id ? creatorMap.get(row.creator_id) ?? null : null,
    }),
  )
}
