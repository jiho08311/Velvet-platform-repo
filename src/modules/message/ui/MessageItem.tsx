type MessageItemMedia = {
  id: string
  url: string
  type: "image" | "video"
  mimeType?: string
}

type MessageItemProps = {
  messageId: string
  content: string
  createdAt: string
  isOwn?: boolean
  media?: MessageItemMedia[]
  type?: "text" | "ppv"
  price?: number | null
  isLocked?: boolean
}

export function MessageItem({
  content,
  createdAt,
  isOwn = false,
  media = [],
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
        {content ? <p className="whitespace-pre-wrap">{content}</p> : null}

        {media.length > 0 ? (
          <div className={`${content ? "mt-3" : ""} space-y-3`}>
            {media.map((item) =>
              item.type === "image" ? (
                <img
                  key={item.id}
                  src={item.url}
                  alt=""
                  className="w-full rounded-xl object-cover"
                />
              ) : (
                <video
                  key={item.id}
                  src={item.url}
                  controls
                  playsInline
                  className="w-full rounded-xl"
                />
              )
            )}
          </div>
        ) : null}

        <span className="mt-1 block text-xs text-zinc-400">{createdAt}</span>
      </div>
    </div>
  )
}