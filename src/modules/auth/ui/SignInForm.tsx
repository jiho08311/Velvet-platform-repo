"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { resolveRedirectTarget } from "@/modules/auth/lib/redirect-handoff";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.6 33.6 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 3l6.1-6.1C34.6 4.5 29.7 2.5 24 2.5 11.6 2.5 1.5 12.6 1.5 25S11.6 47.5 24 47.5c11.9 0 22-8.6 22-22 0-1.5-.2-2.8-.5-4z"/>
      <path fill="#34A853" d="M6.3 14.7l7 5.1C15.3 16.1 19.3 13 24 13c3.1 0 5.9 1.1 8.1 3l6.1-6.1C34.6 4.5 29.7 2.5 24 2.5c-7.8 0-14.5 4.4-17.7 10.9z"/>
      <path fill="#FBBC05" d="M24 47.5c5.9 0 10.8-1.9 14.4-5.2l-6.7-5.5c-2 1.3-4.5 2.1-7.7 2.1-5.9 0-10.8-3.9-12.6-9.2l-7 5.4C9.5 43.1 16.2 47.5 24 47.5z"/>
      <path fill="#EA4335" d="M6.3 35.3l7-5.4C12.5 28.4 12 26.7 12 25s.5-3.4 1.3-4.9l-7-5.1C4.6 18.2 3.5 21.5 3.5 25s1.1 6.8 2.8 10.3z"/>
    </svg>
  );
}

function KakaoLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#191919" d="M12 4C6.5 4 2 7.5 2 11.8c0 2.8 1.8 5.2 4.5 6.6l-1.1 4c-.1.2.2.4.4.3l4.8-3.2c.5.1 1 .1 1.4.1 5.5 0 10-3.5 10-7.8S17.5 4 12 4z"/>
    </svg>
  );
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const next = resolveRedirectTarget({
    target: searchParams.get("next"),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleOAuth(provider: "google" | "kakao") {
    if (isPending) return;

    setIsPending(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Failed to sign in.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
      setIsPending(false);
    }
  }

  async function handleEmailSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) return;

    try {
      setIsPending(true);
      setErrorMessage("");

      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.error || "로그인에 실패했습니다.");
        return;
      }

      router.replace(next);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "로그인에 실패했습니다."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      ) : null}

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-base font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60"
        >
          <GoogleLogo />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuth("kakao")}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-5 py-4 text-base font-medium text-[#191919] transition hover:brightness-95 disabled:opacity-60"
        >
          <KakaoLogo />
          Continue with Kakao
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200" />
        <span className="text-sm text-zinc-400">또는</span>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700"
          >
            이메일
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/10"
            disabled={isPending}
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-700"
          >
            비밀번호
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/10"
            disabled={isPending}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl bg-[#C2185B] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Signing in..." : "이메일로 로그인"}
        </button>
      </form>

      <div className="text-center text-sm text-zinc-600">
        계정이 없으신가요?{" "}
        <a href="/sign-up" className="font-medium text-[#C2185B] hover:underline">
          회원가입
        </a>
      </div>
    </div>
  );
}
