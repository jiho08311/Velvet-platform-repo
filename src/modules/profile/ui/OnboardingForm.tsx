// src/modules/profile/ui/OnboardingForm.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const onboardingFormClassName = "space-y-5"
const onboardingFieldClassName = "space-y-2"
const onboardingLabelClassName = "block text-sm font-medium text-zinc-700"
const onboardingInputClassName =
  "w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/10"
const onboardingHelperTextClassName = "text-xs text-zinc-500"
const onboardingErrorNoticeClassName =
  "rounded-2xl border border-red-300 bg-red-50 px-4 py-3"
const onboardingErrorTextClassName = "text-sm text-red-600"
const onboardingSubmitButtonClassName =
  "w-full rounded-2xl bg-[#C2185B] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-60"

type OnboardingFormProps = {
  next?: string
}

export function OnboardingForm({ next = "/" }: OnboardingFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isPending, setIsPending] = useState(false)
  const usernameDescriptionId = errorMessage
    ? "username-help username-error"
    : "username-help"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage("")
    setIsPending(true)

    try {
      const response = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(data?.error || "Onboarding failed.")
        return
      }

      router.replace(next)
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={onboardingFormClassName}>
      <div className={onboardingFieldClassName}>
        <label htmlFor="username" className={onboardingLabelClassName}>
          Username
        </label>

        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="yourname"
          autoComplete="off"
          aria-describedby={usernameDescriptionId}
          aria-invalid={errorMessage ? true : undefined}
          className={onboardingInputClassName}
          disabled={isPending}
          required
        />

        <p id="username-help" className={onboardingHelperTextClassName}>
          소문자, 숫자, ., _ 사용 가능 / 3~20자
        </p>
      </div>

      {errorMessage ? (
        <div
          id="username-error"
          role="alert"
          className={onboardingErrorNoticeClassName}
        >
          <p className={onboardingErrorTextClassName}>{errorMessage}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={onboardingSubmitButtonClassName}
      >
        {isPending ? "Saving..." : "Continue"}
      </button>
    </form>
  )
}
