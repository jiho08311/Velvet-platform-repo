// src/modules/admin/public/list-payout-requests.ts
import {
  listPayoutRequests as listPayoutRequestsRuntime,
} from "@/modules/admin/runtime/list-payout-requests"

export const PUBLIC_CONTRACT = true

export type AdminPayoutRequestListItem = Awaited<
  ReturnType<typeof listPayoutRequestsRuntime>
>[number]
export type AdminPayoutStatusBadge = AdminPayoutRequestListItem["statusBadges"][number]
export type AdminPayoutBadgeTone = AdminPayoutStatusBadge["tone"]

export async function listPayoutRequests(): Promise<
  AdminPayoutRequestListItem[]
> {
  return listPayoutRequestsRuntime()
}
