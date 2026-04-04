"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";

export function SignUpForm() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          birthDate,
        }),
      });

      const data = await response.json();

      console.log("SIGN UP RESPONSE >>>", data);

      if (!response.ok) {
        alert(data.error || data.message || "Sign up failed");
        return;
      }

      window.location.href = "/sign-in";
    } catch (error) {
      console.error("SIGN UP ERROR >>>", error);
      alert("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    if (googleLoading) return;
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/feed`,
        },
      });

      if (error) {
        alert(error.message || "Google sign up failed");
      }
    } catch (error) {
      console.error("GOOGLE SIGN UP ERROR >>>", error);
      alert("Google sign up failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || loading}
        className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {googleLoading ? "Connecting Google..." : "Continue with Google"}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-zinc-400">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-200">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-200">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-200">
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
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20"
          />

          <p className="text-xs text-zinc-400">
            Only users aged 19 or older can sign up. Age eligibility is checked on
            the server.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-sm font-medium text-white">PASS verification</p>
          <p className="mt-1 text-xs text-zinc-400">
            PASS verification will be connected in the next step after the current
            19+ sign-up check is finalized.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full rounded-full bg-[#C2185B] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </div>
  );
}