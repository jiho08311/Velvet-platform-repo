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
      className="px-0 py-2 text-sm font-medium text-zinc-400 transition hover:text-white disabled:opacity-60"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  )
}