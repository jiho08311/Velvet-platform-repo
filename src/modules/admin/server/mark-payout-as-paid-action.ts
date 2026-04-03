"use server";

import { revalidatePath } from "next/cache";
import { markPayoutAsPaid } from "./mark-payout-as-paid";

export type MarkPayoutAsPaidActionState = {
  error: string | null;
};

export async function markPayoutAsPaidAction(
  _prevState: MarkPayoutAsPaidActionState,
  formData: FormData
): Promise<MarkPayoutAsPaidActionState> {
  const payoutRequestId = formData.get("payoutRequestId");

  if (typeof payoutRequestId !== "string" || !payoutRequestId) {
    return { error: "invalid payoutRequestId" };
  }

  try {
    await markPayoutAsPaid(payoutRequestId);
    revalidatePath("/admin/payout-requests");

    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "failed to mark payout as paid",
    };
  }
}