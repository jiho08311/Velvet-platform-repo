"use client";

import { useState } from "react";

type PassVerificationButtonProps = {
  profileId: string;
};

export function PassVerificationButton({
  profileId,
}: PassVerificationButtonProps) {
  const [loading, setLoading] = useState(false);

  function handleClick() {
    if (loading) return;

    setLoading(true);
    window.location.href = `/api/auth/pass/start?profileId=${encodeURIComponent(
      profileId
    )}`;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-full bg-[#C2185B] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Redirecting..." : "Verify with PASS"}
    </button>
  );
}