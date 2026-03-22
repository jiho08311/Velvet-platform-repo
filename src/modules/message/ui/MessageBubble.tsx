type MessageBubbleProps = {
  text: string
  createdAt: string
  isOwnMessage: boolean
}

export function MessageBubble({
  text,
  createdAt,
  isOwnMessage,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
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
    </div>
  )
}