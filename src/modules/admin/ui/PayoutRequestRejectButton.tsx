"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  rejectPayoutRequestAction,
  type RejectPayoutRequestActionState,
} from "../server/reject-payout-request-action";
import { getPayoutActionButtonClassName } from "./payoutActionButtonClassName";

type PayoutRequestRejectButtonProps = {
  payoutRequestId: string;
  disabled?: boolean;
};

const initialState: RejectPayoutRequestActionState = {
  error: null,
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={getPayoutActionButtonClassName(
        "border border-red-500/30 bg-red-500/10 text-red-400"
      )}
    >
      {pending ? "Rejecting..." : "Reject"}
    </button>
  );
}

export function PayoutRequestRejectButton({
  payoutRequestId,
  disabled = false,
}: PayoutRequestRejectButtonProps) {
  const [state, formAction] = useActionState(
    rejectPayoutRequestAction,
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
