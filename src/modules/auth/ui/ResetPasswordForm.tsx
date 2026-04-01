"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage("")
    setSuccessMessage("")

    if (password.length < 8) {
      setErrorMessage("비밀번호는 최소 8자 이상이어야 합니다.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.")
      return
    }

    setIsPending(true)

    try {
      const supabase = createSupabaseBrowserClient()

      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        if (error.message.includes("Auth session missing")) {
          setErrorMessage(
            "세션이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요."
          )
        } else {
          setErrorMessage(error.message)
        }
        return
      }

      setSuccessMessage("비밀번호가 변경되었습니다. 다시 로그인해주세요.")

      setTimeout(() => {
        router.replace("/sign-in")
        router.refresh()
      }, 1200)
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
          htmlFor="password"
          className="block text-sm font-medium text-zinc-700"
        >
          New password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter new password"
          className="w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/10"
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-zinc-700"
        >
          Confirm password
        </label>

        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm new password"
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
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[#C2185B] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Updating..." : "Update password"}
      </button>
    </form>
  )
}