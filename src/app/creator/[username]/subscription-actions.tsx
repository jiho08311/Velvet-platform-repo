"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SubscribeButton from "../../../modules/creator/ui/SubscribeButton";

type SubscriptionActionsProps = {
  creatorId: string;
  isOwner: boolean;
  isSubscribed: boolean;
};

export default function SubscriptionActions({
  creatorId,
  isOwner,
  isSubscribed,
}: SubscriptionActionsProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleCancel() {
    try {
      setIsCancelling(true);

      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        alert(body?.error ?? "Failed to cancel subscription");
        return;
      }

      router.refresh();
    } catch {
      alert("Failed to cancel subscription");
    } finally {
      setIsCancelling(false);
    }
  }

  if (isOwner) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
        This is your creator page
      </div>
    );
  }

  if (!isSubscribed) {
    return <SubscribeButton creatorId={creatorId} />;
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="rounded-2xl border border-emerald-800 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-400">
        Subscribed
      </div>

      <button
        type="button"
        onClick={handleCancel}
        disabled={isCancelling}
        className="rounded-2xl border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCancelling ? "Cancelling..." : "Cancel subscription"}
      </button>
    </div>
  );
}