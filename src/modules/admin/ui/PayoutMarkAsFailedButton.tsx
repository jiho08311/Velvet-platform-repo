"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { markPayoutAsFailedAction } from "../public/mark-payout-as-failed-action";
import { getPayoutActionButtonClassName } from "./payoutActionButtonClassName";

type PayoutMarkAsFailedButtonProps = {
  payoutRequestId: string;
  disabled?: boolean;
};

const initialState = {
  error: null,
} satisfies { error: string | null };

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
