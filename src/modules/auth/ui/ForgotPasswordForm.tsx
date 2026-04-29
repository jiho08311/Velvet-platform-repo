"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"
import {
  AuthFormField,
  AuthFormInput,
  AuthFormNotice,
  AuthFormSubmitButton,
} from "@/modules/auth/ui/AuthFormField"

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
      <AuthFormField htmlFor="email" label="Email">
        <AuthFormInput
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
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
        {isPending ? "Sending..." : "Send reset link"}
      </AuthFormSubmitButton>
    </form>
  )
}
