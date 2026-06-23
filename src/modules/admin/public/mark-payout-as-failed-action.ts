// src/modules/admin/public/mark-payout-as-failed-action.ts
"use server"
// PUBLIC_CONTRACT

import {
  markPayoutAsFailedAction as markPayoutAsFailedServerAction,
  type MarkPayoutAsFailedActionState,
} from "@/modules/admin/runtime/mark-payout-as-failed-action"

export async function markPayoutAsFailedAction(
  prevState: MarkPayoutAsFailedActionState,
  formData: FormData
): Promise<MarkPayoutAsFailedActionState> {
  return markPayoutAsFailedServerAction(prevState, formData)
}
