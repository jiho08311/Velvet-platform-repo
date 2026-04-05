"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageComposer } from "./MessageComposer"

type MessageComposerSectionProps = {
  conversationId: string
}

type MessageComposerSendData = {
  content: string
  type: "text"
  files: File[]
}

export function MessageComposerSection({
  conversationId,
}: MessageComposerSectionProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  async function uploadFiles(files: File[]) {
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

    if (!response.ok) {
      const message =
        result &&
        typeof result === "object" &&
        "error" in result &&
        typeof result.error === "string"
          ? result.error
          : "파일 업로드에 실패했습니다"

      throw new Error(message)
    }

    if (
      !result ||
      typeof result !== "object" ||
      !("mediaIds" in result) ||
      !Array.isArray(result.mediaIds)
    ) {
      throw new Error("업로드 응답이 올바르지 않습니다")
    }

    return result.mediaIds.filter(
      (value): value is string => typeof value === "string"
    )
  }

  async function handleSend(data: MessageComposerSendData) {
    setError(null)
    setIsSending(true)

    try {
      const mediaIds = await uploadFiles(data.files)

      const response = await fetch(`/api/messages/${conversationId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          content: data.content,
          type: "text",
          mediaIds,
        }),
      })

      let result: unknown = null

      try {
        result = await response.json()
      } catch {
        result = null
      }

      if (!response.ok) {
        const message =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "메시지 전송에 실패했습니다"

        throw new Error(message)
      }

      router.refresh()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "TEXT_BLOCKED") {
          setError("부적절한 텍스트가 포함되어 있어 메시지를 보낼 수 없습니다.")
          return
        }

        if (error.message === "IMAGE_BLOCKED") {
          setError("부적절한 이미지가 포함되어 있어 메시지를 보낼 수 없습니다.")
          return
        }

        setError(error.message)
        return
      }

      setError("메시지 전송에 실패했습니다")
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
          전송 중...
        </div>
      ) : null}

      <MessageComposer onSend={handleSend} />
    </div>
  )
}