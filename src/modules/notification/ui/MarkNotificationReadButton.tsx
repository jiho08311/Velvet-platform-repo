"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type MarkNotificationReadButtonProps = {
  notificationId: string
}

export default function MarkNotificationReadButton({
  notificationId,
}: MarkNotificationReadButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleMarkAsRead() {
    try {
      setLoading(true)

      const response = await fetch("/api/notification/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to mark notification as read")
      }

      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleMarkAsRead}
      disabled={loading}
      className="rounded-full bg-[#C2185B] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Marking..." : "Mark as read"}
    </button>
  )
}