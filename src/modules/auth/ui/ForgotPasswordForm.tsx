"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage("")
    setSuccessMessage("")
    setIsPending(true)

    try {
      const supabase = createSupabaseBrowserClient()

      const redirectTo = `${window.location.origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage(
        "이메일을 확인해주세요.\n비밀번호 재설정 링크를 보냈습니다."
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-700"
        >
          Email
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

      {errorMessage ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-green-300 bg-green-50 px-4 py-3">
          <p className="whitespace-pre-line text-sm text-green-700">
            {successMessage}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[#C2185B] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sending..." : "Send reset link"}
      </button>
    </form>
  )
}