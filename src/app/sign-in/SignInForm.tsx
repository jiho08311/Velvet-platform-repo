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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-zinc-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500"
          placeholder="testuser@example.com"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-zinc-300"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500"
          placeholder="••••••••"
          required
        />
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  )
}