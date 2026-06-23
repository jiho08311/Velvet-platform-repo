"use server"

import { revalidatePath } from "next/cache"
import { rejectPayoutRequest } from "@/modules/commerce/public/payout-contract"
import { requireAdmin } from "./require-admin"

export type RejectPayoutRequestActionState = {
  error: string | null
}

export async function rejectPayoutRequestAction(
  _prevState: RejectPayoutRequestActionState,
  formData: FormData
): Promise<RejectPayoutRequestActionState> {
  const payoutRequestId = formData.get("payoutRequestId")

  if (typeof payoutRequestId !== "string" || !payoutRequestId) {
    return { error: "invalid payoutRequestId" }
  }

  try {
    await requireAdmin()

    await rejectPayoutRequest({
      payoutRequestId,
    })

    revalidatePath("/admin/payout-requests")

    return { error: null }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "failed to reject payout request",
    }
  }
}
