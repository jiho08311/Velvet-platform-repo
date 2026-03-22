type MessageItemProps = {
  content: string
  createdAt: string
  isOwn?: boolean
}

export function MessageItem({
  content,
  createdAt,
  isOwn = false,
}: MessageItemProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] border px-3 py-2 text-sm ${
          isOwn
            ? "border-[#C2185B]/20 bg-[#FFF1F5] text-zinc-900"
            : "border-zinc-200 bg-white text-zinc-800"
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        <span className="mt-1 block text-xs text-zinc-400">
          {createdAt}
        </span>
      </div>
    </div>
  )
}