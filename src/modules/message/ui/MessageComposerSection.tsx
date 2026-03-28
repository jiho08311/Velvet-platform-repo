"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageComposer } from "./MessageComposer"

type MessageComposerSectionProps = {
  conversationId: string
}

type MessageComposerSendData = {
  content: string
  type: "text" | "ppv"
  price?: number
  files: File[]
}

export function MessageComposerSection({
  conversationId,
}: MessageComposerSectionProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  async function uploadFiles(files: File[]) {
    console.log("[MessageComposerSection] uploadFiles input:", files)

    if (files.length === 0) {
      return []
    }

    const formData = new FormData()

    for (const file of files) {
      formData.append("files", file)
    }

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    })

    let result: unknown = null

    try {
      result = await response.json()
    } catch {
      result = null
    }

    console.log("[MessageComposerSection] upload response:", result)

    if (!response.ok) {
      const message =
        result &&
        typeof result === "object" &&
        "error" in result &&
        typeof result.error === "string"
          ? result.error
          : "Failed to upload media"

      throw new Error(message)
    }

    if (
      !result ||
      typeof result !== "object" ||
      !("mediaIds" in result) ||
      !Array.isArray(result.mediaIds)
    ) {
      throw new Error("Invalid upload response")
    }

    return result.mediaIds.filter(
      (value): value is string => typeof value === "string"
    )
  }

  async function handleSend(data: MessageComposerSendData) {
    setError(null)
    setIsSending(true)

    try {
      console.log("[MessageComposerSection] handleSend files:", data.files)

      const mediaIds = await uploadFiles(data.files)

      console.log("[MessageComposerSection] mediaIds:", mediaIds)

      const response = await fetch(`/api/messages/${conversationId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          content: data.content,
          type: data.type,
          price: data.price,
          mediaIds,
        }),
      })

      let result: unknown = null

      try {
        result = await response.json()
      } catch {
        result = null
      }

      console.log("[MessageComposerSection] send response:", result)

      if (!response.ok) {
        const message =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Failed to send message"

        throw new Error(message)
      }

      router.refresh()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to send message"
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {isSending ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
          Sending...
        </div>
      ) : null}

      <MessageComposer onSend={handleSend} />
    </div>
  )
}