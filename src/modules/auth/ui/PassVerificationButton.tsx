"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type PassVerificationButtonProps = {
  profileId: string;
  next?: string | null;
  children?: ReactNode;
  loadingLabel?: ReactNode;
};

export function PassVerificationButton({
  profileId,
  next,
  children = "Verify with PASS",
  loadingLabel = "Redirecting...",
}: PassVerificationButtonProps) {
  const [loading, setLoading] = useState(false);

  function handleClick() {
    if (loading) return;

    const searchParams = new URLSearchParams({
      profileId,
    });

    if (next) {
      searchParams.set("next", next);
    }

    setLoading(true);
    window.location.href = `/api/auth/pass/start?${searchParams.toString()}`;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-2xl bg-[#C2185B] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
