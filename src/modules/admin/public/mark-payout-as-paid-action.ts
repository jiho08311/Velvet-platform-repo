// src/modules/admin/public/mark-payout-as-paid-action.ts
"use server"
// PUBLIC_CONTRACT

import {
  markPayoutAsPaidAction as markPayoutAsPaidServerAction,
  type MarkPayoutAsPaidActionState,
} from "@/modules/admin/runtime/mark-payout-as-paid-action"

export async function markPayoutAsPaidAction(
  prevState: MarkPayoutAsPaidActionState,
  formData: FormData
): Promise<MarkPayoutAsPaidActionState> {
  return markPayoutAsPaidServerAction(prevState, formData)
}
