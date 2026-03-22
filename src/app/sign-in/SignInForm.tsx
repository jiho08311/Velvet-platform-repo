"use client"

import { useState } from "react"
import { createBrowserSupabaseClient } from "@/modules/auth/lib/create-browser-supabase-client"

type SignInFormProps = {
  nextPath: string
}

export default function SignInForm({ nextPath }: SignInFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setLoading(true)
      setErrorMessage("")

      const supabase = createBrowserSupabaseClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("SIGN_IN_RESULT", { data, error })

      if (error) {
        throw error
      }

      window.location.href = nextPath || "/dashboard"
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sign in"

      console.error("SIGN_IN_ERROR", error)
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-base text-zinc-900 outline-none focus:border-zinc-900"
          placeholder="testuser@example.com"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-zinc-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-base text-zinc-900 outline-none focus:border-zinc-900"
          placeholder="••••••••"
          required
        />
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-2xl bg-[#C2185B] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#D81B60] disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  )
}