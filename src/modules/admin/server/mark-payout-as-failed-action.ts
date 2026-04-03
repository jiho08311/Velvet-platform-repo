"use server";

import { revalidatePath } from "next/cache";
import { markPayoutAsFailed } from "./mark-payout-as-failed";

export type MarkPayoutAsFailedActionState = {
  error: string | null;
};

export async function markPayoutAsFailedAction(
  _prevState: MarkPayoutAsFailedActionState,
  formData: FormData
): Promise<MarkPayoutAsFailedActionState> {
  const payoutRequestId = formData.get("payoutRequestId");

  if (typeof payoutRequestId !== "string" || !payoutRequestId) {
    return { error: "invalid payoutRequestId" };
  }

  try {
    await markPayoutAsFailed(payoutRequestId);
    revalidatePath("/admin/payout-requests");

    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "failed to mark payout as failed",
    };
  }
}