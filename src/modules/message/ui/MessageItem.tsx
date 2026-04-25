import { ReportButton } from "@/modules/report/ui/ReportButton"

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
  reportPathname?: string
}

export function MessageItem({
  messageId,
  content,
  createdAt,
  isOwn = false,
  media = [],
  reportPathname,
}: MessageItemProps) {
  const formattedCreatedAt = new Date(createdAt).toLocaleString()

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-3 ${
            isOwn
              ? "bg-white text-black"
              : "border border-white/10 bg-white/5 text-white"
          }`}
        >
          <div className="space-y-3">
            {content ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                {content}
              </p>
            ) : null}

            {media.length > 0 ? (
              <div className="space-y-3">
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
                      preload="metadata"
                      className="w-full rounded-xl"
                    />
                  )
                )}
              </div>
            ) : null}
          </div>

          <p
            className={`mt-2 text-xs ${
              isOwn ? "text-black/60" : "text-white/50"
            }`}
          >
            {formattedCreatedAt}
          </p>
        </div>

        {!isOwn && reportPathname ? (
          <div className="mt-1">
            <ReportButton
              payload={{
                targetType: "message",
                targetId: messageId,
                pathname: reportPathname,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
