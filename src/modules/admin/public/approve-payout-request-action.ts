// src/modules/admin/public/approve-payout-request-action.ts
"use server"
// PUBLIC_CONTRACT

import {
  approvePayoutRequestAction as approvePayoutRequestServerAction,
  type ApprovePayoutRequestActionState,
} from "@/modules/admin/runtime/approve-payout-request-action"

export async function approvePayoutRequestAction(
  prevState: ApprovePayoutRequestActionState,
  formData: FormData
): Promise<ApprovePayoutRequestActionState> {
  return approvePayoutRequestServerAction(prevState, formData)
}
