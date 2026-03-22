"use client"

import { useState } from "react"

type MessageInputProps = {
  onSend?: (message: string) => void
  placeholder?: string
}

export function MessageInput({
  onSend,
  placeholder = "Write a message...",
}: MessageInputProps) {
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!value.trim() || loading) return

    try {
      setLoading(true)
      await onSend?.(value.trim())
      setValue("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-zinc-200 p-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#C2185B]"
      />

      <button
        onClick={handleSend}
        disabled={loading || !value.trim()}
        className="rounded-md bg-[#C2185B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#D81B60] disabled:opacity-50"
      >
        Send
      </button>
    </div>
  )
}