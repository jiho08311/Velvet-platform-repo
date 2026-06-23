import {
  listAdminPayoutRequestItems,
  type AdminPayoutBadgeTone,
  type AdminPayoutRequestListItem,
  type AdminPayoutStatusBadge,
} from "@/modules/commerce/public/payout-contract"
import { requireAdmin } from "@/modules/admin/runtime/require-admin"

export type {
  AdminPayoutBadgeTone,
  AdminPayoutRequestListItem,
  AdminPayoutStatusBadge,
}

export async function listPayoutRequests(): Promise<
  AdminPayoutRequestListItem[]
> {
  await requireAdmin()

  return listAdminPayoutRequestItems()
}
