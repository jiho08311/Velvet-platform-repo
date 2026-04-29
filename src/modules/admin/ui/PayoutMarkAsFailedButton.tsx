"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  markPayoutAsFailedAction,
  type MarkPayoutAsFailedActionState,
} from "../server/mark-payout-as-failed-action";

type PayoutMarkAsFailedButtonProps = {
  payoutRequestId: string;
  disabled?: boolean;
};

const initialState: MarkPayoutAsFailedActionState = {
  error: null,
};

const payoutActionButtonBaseClassName =
  "rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

function getPayoutActionButtonClassName(toneClassName: string) {
  return `${payoutActionButtonBaseClassName} ${toneClassName}`;
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={getPayoutActionButtonClassName(
        "border border-amber-500/30 bg-amber-500/10 text-amber-400"
      )}
    >
      {pending ? "Failing..." : "Mark as Failed"}
    </button>
  );
}

export function PayoutMarkAsFailedButton({
  payoutRequestId,
  disabled = false,
}: PayoutMarkAsFailedButtonProps) {
  const [state, formAction] = useActionState(
    markPayoutAsFailedAction,
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