"use client"

import { ReportButton } from "@/modules/report/ui/ReportButton"

type MessageBubbleProps = {
  messageId: string
  text: string
  createdAt: string
  isOwnMessage: boolean
  pathname: string
}

export function MessageBubble({
  messageId,
  text,
  createdAt,
  isOwnMessage,
  pathname,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isOwnMessage
              ? "rounded-br-md bg-white text-black"
              : "rounded-bl-md border border-white/10 bg-neutral-900 text-white"
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {text}
          </p>
          <p
            className={`mt-2 text-[11px] ${
              isOwnMessage ? "text-black/60" : "text-white/45"
            }`}
          >
            {createdAt}
          </p>
        </div>

        {!isOwnMessage ? (
          <div className="mt-2">
            <ReportButton
              payload={{
                targetType: "message",
                targetId: messageId,
                pathname,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
