"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";

export function SignUpForm() {
  const supabase = createSupabaseBrowserClient();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);

  async function handleGoogleSignUp() {
    if (googleLoading || kakaoLoading) return;
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

async function handleKakaoSignUp() {
  if (googleLoading || kakaoLoading) return;
  setKakaoLoading(true);

  try {
    const { error } = await supabase.auth.signInWithOAuth({
  provider: "kakao",
  options: {
    redirectTo: `${window.location.origin}/auth/callback?next=/`,
    scopes: "", 
  },
});

    if (error) {
      console.error("KAKAO OAUTH ERROR >>>", error);
      alert(error.message || "Kakao sign up failed");
    }
  } catch (error) {
    console.error("KAKAO SIGN UP ERROR >>>", error);
    alert("Kakao sign up failed");
  } finally {
    setKakaoLoading(false);
  }
}

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || kakaoLoading}
        className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {googleLoading ? "Connecting Google..." : "Continue with Google"}
      </button>

      <button
        type="button"
        onClick={handleKakaoSignUp}
        disabled={googleLoading || kakaoLoading}
        className="w-full rounded-full bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {kakaoLoading ? "Connecting Kakao..." : "Continue with Kakao"}
      </button>
    </div>
  );
}