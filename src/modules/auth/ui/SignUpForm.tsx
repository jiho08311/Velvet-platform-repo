"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";

export function SignUpForm() {
  const supabase = createSupabaseBrowserClient();
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignUp() {
    if (googleLoading) return;
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });

      if (error) {
        console.error("GOOGLE OAUTH ERROR >>>", error);
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
        disabled={googleLoading}
        className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {googleLoading ? "Connecting Google..." : "Continue with Google"}
      </button>
    </div>
  );
}