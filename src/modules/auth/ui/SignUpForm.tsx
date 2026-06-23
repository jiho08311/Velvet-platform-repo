"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import {
  buildPathWithNext,
  resolveRedirectTarget,
  VERIFY_PASS_PATH,
} from "@/modules/auth/utils/redirect-handoff";
import {
  AuthFormInput,
  AuthFormNotice,
  AuthFormSubmitButton,
} from "@/modules/auth/ui/AuthFormField";

const signUpButtonBaseClassName =
  "w-full rounded-2xl px-5 py-4 text-base transition disabled:opacity-60";
const oAuthButtonBaseClassName = [
  signUpButtonBaseClassName,
  "flex items-center justify-center gap-3 font-medium",
].join(" ");
const googleButtonClassName = [
  oAuthButtonBaseClassName,
  "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
].join(" ");
const kakaoButtonClassName = [
  oAuthButtonBaseClassName,
  "bg-[#FEE500] text-[#191919] hover:brightness-95",
].join(" ");

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
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const next = resolveRedirectTarget({
    fallback: "/",
    target: searchParams.get("next"),
  });

  const [googleLoading, setGoogleLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);

  const [agreed, setAgreed] = useState(false);

  // ✅ 추가된 state (기존 로직 영향 없음)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGoogleSignUp() {
    if (!agreed) {
      setErrorMessage("약관에 동의해주세요.");
      return;
    }

    if (googleLoading || kakaoLoading) return;
    setGoogleLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) setErrorMessage(error.message || "Google sign up failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleKakaoSignUp() {
    if (!agreed) {
      setErrorMessage("약관에 동의해주세요.");
      return;
    }

    if (googleLoading || kakaoLoading) return;
    setKakaoLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) setErrorMessage(error.message || "Kakao sign up failed");
    } finally {
      setKakaoLoading(false);
    }
  }

  // ✅ 이메일 회원가입 (추가만)
  async function handleEmailSignUp() {
    if (!agreed) {
      setErrorMessage("약관에 동의해주세요.");
      return;
    }

    if (!email || !password || !birthDate) {
      setErrorMessage("모든 값을 입력해주세요.");
      return;
    }

    setEmailLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/sign-up", {
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

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "회원가입 실패");
        return;
      }

      window.location.href = buildPathWithNext({
        path: VERIFY_PASS_PATH,
        next,
      });
    } catch (e) {
      setErrorMessage("에러 발생");
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <AuthFormNotice tone="error">{errorMessage}</AuthFormNotice>
      ) : null}

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

      {/* ✅ 이메일 회원가입 UI (추가) */}
      <div className="space-y-4">
        <AuthFormInput
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthFormInput
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <AuthFormInput
          type="date"
          max={new Date().toISOString().split("T")[0]}
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          style={{ colorScheme: "light" }}
        />
        <AuthFormSubmitButton
          type="button"
          onClick={handleEmailSignUp}
          disabled={emailLoading}
        >
          {emailLoading ? "처리중..." : "이메일로 회원가입"}
        </AuthFormSubmitButton>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading || kakaoLoading}
        className={googleButtonClassName}
      >
        <GoogleLogo />
        {googleLoading ? "Connecting..." : "Continue with Google"}
      </button>

      {/* Kakao */}
      <button
        type="button"
        onClick={handleKakaoSignUp}
        disabled={googleLoading || kakaoLoading}
        className={kakaoButtonClassName}
      >
        <KakaoLogo />
        {kakaoLoading ? "Connecting..." : "Continue with Kakao"}
      </button>
    </div>
  );
}
