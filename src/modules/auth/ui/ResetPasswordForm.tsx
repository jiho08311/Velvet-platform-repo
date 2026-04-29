"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"
import {
  AuthFormField,
  AuthFormInput,
  AuthFormNotice,
  AuthFormSubmitButton,
} from "@/modules/auth/ui/AuthFormField"

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
      <AuthFormField htmlFor="password" label="New password">
        <AuthFormInput
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter new password"
          disabled={isPending}
          required
        />
      </AuthFormField>

      <AuthFormField htmlFor="confirmPassword" label="Confirm password">
        <AuthFormInput
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm new password"
          disabled={isPending}
          required
        />
      </AuthFormField>

      {errorMessage ? (
        <AuthFormNotice tone="error">{errorMessage}</AuthFormNotice>
      ) : null}

      {successMessage ? (
        <AuthFormNotice tone="success">{successMessage}</AuthFormNotice>
      ) : null}

      <AuthFormSubmitButton
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Updating..." : "Update password"}
      </AuthFormSubmitButton>
    </form>
  )
}
