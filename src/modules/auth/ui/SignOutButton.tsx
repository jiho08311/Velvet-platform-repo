"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function SignOutButton() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleSignOut() {
    try {
      setIsPending(true)

      await fetch("/api/auth/sign-out", {
        method: "POST",
      })

      router.replace("/sign-in")
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
    >
      {isPending ? "Signing out..." : "Logout"}
    </button>
  )
}