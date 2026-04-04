"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";

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
          redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
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
          className="w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-base font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuth("kakao")}
          disabled={isPending}
          className="w-full rounded-2xl bg-[#FEE500] px-5 py-4 text-base font-medium text-[#191919] transition hover:brightness-95 disabled:opacity-60"
        >
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