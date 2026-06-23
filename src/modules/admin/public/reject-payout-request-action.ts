// src/modules/admin/public/reject-payout-request-action.ts
"use server"
// PUBLIC_CONTRACT

import {
  rejectPayoutRequestAction as rejectPayoutRequestServerAction,
  type RejectPayoutRequestActionState,
} from "@/modules/admin/runtime/reject-payout-request-action"

export async function rejectPayoutRequestAction(
  prevState: RejectPayoutRequestActionState,
  formData: FormData
): Promise<RejectPayoutRequestActionState> {
  return rejectPayoutRequestServerAction(prevState, formData)
}
