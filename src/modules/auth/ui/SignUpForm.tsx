"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.7 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12S6.6 21.8 12 21.8c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.3H12z"
      />
      <path
        fill="#34A853"
        d="M3.4 7.4l3.2 2.3C7.5 8 9.6 6.6 12 6.6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.9 14.7 2.9 12 2.9c-3.8 0-7.1 2.2-8.6 5.5z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.8c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1.1-3.4 1.1-3.7 0-5.1-2.5-5.4-3.8l-3.2 2.5c1.5 3.4 4.8 5.1 8.6 5.1z"
      />
      <path
        fill="#4285F4"
        d="M3.4 16.7l3.2-2.5c-.2-.5-.3-1-.3-1.6s.1-1.1.3-1.6L3.4 8.5C2.7 9.8 2.2 10.9 2.2 12s.5 2.2 1.2 4.7z"
      />
    </svg>
  );
}

function KakaoLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
    >
      <path
        fill="#191919"
        d="M12 4C6.5 4 2 7.5 2 11.8c0 2.8 1.8 5.2 4.5 6.6l-1.1 4c-.1.2.2.4.4.3l4.8-3.2c.5.1 1 .1 1.4.1 5.5 0 10-3.5 10-7.8S17.5 4 12 4z"
      />
    </svg>
  );
}

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
        className="flex w-full items-center justify-center gap-3 rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleLogo />
        <span>
          {googleLoading ? "Connecting Google..." : "Continue with Google"}
        </span>
      </button>

      <button
        type="button"
        onClick={handleKakaoSignUp}
        disabled={googleLoading || kakaoLoading}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <KakaoLogo />
        <span>
          {kakaoLoading ? "Connecting Kakao..." : "Continue with Kakao"}
        </span>
      </button>
    </div>
  );
}