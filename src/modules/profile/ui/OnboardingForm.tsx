"use client";

import { useState } from "react";

export function OnboardingForm() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          username,
          birthDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to complete onboarding");
        return;
      }

      window.location.href = "/feed";
    } catch (error) {
      console.error("ONBOARDING ERROR >>>", error);
      alert("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700">
          Display name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
          required
          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/10"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
            )
          }
          placeholder="username"
          required
          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/10"
        />
        <p className="text-xs text-zinc-500">
          영문 소문자, 숫자, 밑줄(_)만 사용할 수 있습니다.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700">
          Birth date
        </label>
        <input
          type="text"
          value={birthDate}
          onChange={(e) => {
            let value = e.target.value.replace(/[^0-9]/g, "");

            if (value.length > 8) return;

            if (value.length >= 5) {
              value = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
            } else if (value.length >= 3) {
              value = `${value.slice(0, 4)}-${value.slice(4)}`;
            }

            setBirthDate(value);
          }}
          placeholder="YYYY-MM-DD"
          required
          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/10"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[#C2185B] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}