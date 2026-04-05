"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.7 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12S6.6 21.8 12 21.8c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.3H12z" />
    </svg>
  );
}

function KakaoLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#191919" d="M12 4C6.5 4 2 7.5 2 11.8c0 2.8 1.8 5.2 4.5 6.6l-1.1 4c-.1.2.2.4.4.3l4.8-3.2c.5.1 1 .1 1.4.1 5.5 0 10-3.5 10-7.8S17.5 4 12 4z" />
    </svg>
  );
}

export function SignUpForm() {
  const supabase = createSupabaseBrowserClient();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);

  const [agreed, setAgreed] = useState(false);

  async function handleGoogleSignUp() {
    if (!agreed) {
      alert("약관에 동의해주세요.");
      return;
    }

    if (googleLoading || kakaoLoading) return;
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });

      if (error) alert(error.message || "Google sign up failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleKakaoSignUp() {
    if (!agreed) {
      alert("약관에 동의해주세요.");
      return;
    }

    if (googleLoading || kakaoLoading) return;
    setKakaoLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });

      if (error) alert(error.message || "Kakao sign up failed");
    } finally {
      setKakaoLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 약관 동의 */}
      <label className="flex items-start gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1"
        />
        <span>
          <a href="/terms" className="underline">이용약관</a>,{" "}
          <a href="/privacy" className="underline">개인정보 처리방침</a>,{" "}
          <a href="/policy" className="underline">운영정책</a>,{" "}
          <a href="/youth" className="underline">청소년 보호정책</a>에 동의합니다.
        </span>
      </label>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || kakaoLoading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
      >
        <GoogleLogo />
        {googleLoading ? "Connecting..." : "Continue with Google"}
      </button>

      {/* Kakao */}
      <button
        type="button"
        onClick={handleKakaoSignUp}
        disabled={googleLoading || kakaoLoading}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] hover:brightness-95 disabled:opacity-50"
      >
        <KakaoLogo />
        {kakaoLoading ? "Connecting..." : "Continue with Kakao"}
      </button>
    </div>
  );
}