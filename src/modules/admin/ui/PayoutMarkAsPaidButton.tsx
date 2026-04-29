"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  markPayoutAsPaidAction,
  type MarkPayoutAsPaidActionState,
} from "../server/mark-payout-as-paid-action";

type PayoutMarkAsPaidButtonProps = {
  payoutRequestId: string;
  disabled?: boolean;
};

const initialState: MarkPayoutAsPaidActionState = {
  error: null,
};

const payoutActionButtonBaseClassName =
  "rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

function getPayoutActionButtonClassName(toneClassName: string) {
  return `${payoutActionButtonBaseClassName} ${toneClassName}`;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={getPayoutActionButtonClassName("bg-emerald-500 text-white")}
    >
      {pending ? "Processing..." : "Mark as Paid"}
    </button>
  );
}

export function PayoutMarkAsPaidButton({
  payoutRequestId,
  disabled = false,
}: PayoutMarkAsPaidButtonProps) {
  const [state, formAction] = useActionState(
    markPayoutAsPaidAction,
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