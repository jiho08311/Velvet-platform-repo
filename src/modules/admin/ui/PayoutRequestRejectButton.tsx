"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  rejectPayoutRequestAction,
  type RejectPayoutRequestActionState,
} from "../server/reject-payout-request-action";

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
      className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition disabled:cursor-not-allowed disabled:opacity-50"
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
      {state.error ? <p className="text-xs text-red-400">{state.error}</p> : null}
    </form>
  );
}