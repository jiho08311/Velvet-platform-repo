"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.7 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12S6.6 21.8 12 21.8c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.3H12z"
      />
    </svg>
  );
}

function KakaoLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path
        fill="#191919"
        d="M12 4C6.5 4 2 7.5 2 11.8c0 2.8 1.8 5.2 4.5 6.6l-1.1 4c-.1.2.2.4.4.3l4.8-3.2c.5.1 1 .1 1.4.1 5.5 0 10-3.5 10-7.8S17.5 4 12 4z"
      />
    </svg>
  );
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const next = searchParams.get("next") || "/feed";

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
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            next
          )}`,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Failed to sign in.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
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

      <div className="text-center text-sm text-zinc-600">
        계정이 없으신가요?{" "}
        <a
          href="/sign-up"
          className="font-medium text-[#C2185B] hover:underline"
        >
          회원가입
        </a>
      </div>
    </div>
  );
}