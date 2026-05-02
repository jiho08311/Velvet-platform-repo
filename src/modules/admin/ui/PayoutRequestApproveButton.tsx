"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  approvePayoutRequestAction,
  type ApprovePayoutRequestActionState,
} from "../server/approve-payout-request-action";
import { getPayoutActionButtonClassName } from "./payoutActionButtonClassName";

type PayoutRequestApproveButtonProps = {
  payoutRequestId: string;
  disabled?: boolean;
};

const initialState: ApprovePayoutRequestActionState = {
  error: null,
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={getPayoutActionButtonClassName("bg-white text-black")}
    >
      {pending ? "Approving..." : "Approve"}
    </button>
  );
}

export function PayoutRequestApproveButton({
  payoutRequestId,
  disabled = false,
}: PayoutRequestApproveButtonProps) {
  const [state, formAction] = useActionState(
    approvePayoutRequestAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="payoutRequestId" value={payoutRequestId} />
      <SubmitButton disabled={disabled} />
      {state.error ? (
        <p className="text-xs text-red-400">{state.error}</p>
      ) : null}
    </form>
  );
}
