"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";
import { approvePayoutRequest } from "@/modules/payout/server/approve-payout-request";

export type ApprovePayoutRequestActionState = {
  error: string | null;
};

export async function approvePayoutRequestAction(
  _prevState: ApprovePayoutRequestActionState,
  formData: FormData
): Promise<ApprovePayoutRequestActionState> {
  const payoutRequestId = formData.get("payoutRequestId");

  if (typeof payoutRequestId !== "string" || !payoutRequestId) {
    return { error: "invalid payoutRequestId" };
  }

  try {
    await requireAdmin();

    await approvePayoutRequest({
      payoutRequestId,
    });

    revalidatePath("/admin/payout-requests");

    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "failed to approve payout request",
    };
  }
}