import { MessagePurchaseButton } from "./MessagePurchaseButton"

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

function formatPrice(amount: number) {
  return new Intl.NumberFormat("ko-KR").format(amount)
}

export function MessageItem({
  messageId,
  content,
  createdAt,
  isOwn = false,
  media = [],
  type = "text",
  price = null,
  isLocked = false,
}: MessageItemProps) {
  const showLockedPpv = type === "ppv" && isLocked && !isOwn

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] border px-3 py-2 text-sm ${
          isOwn
            ? "border-[#C2185B]/20 bg-[#FFF1F5] text-zinc-900"
            : "border-zinc-200 bg-white text-zinc-800"
        }`}
      >
        {showLockedPpv ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-sm font-semibold text-zinc-900">
                🔒 프리미엄 메시지
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {typeof price === "number" && price > 0
                  ? `₩${formatPrice(price)} 결제 후 내용을 확인할 수 있어요`
                  : "결제 후 내용을 확인할 수 있어요"}
              </p>
            </div>

            <MessagePurchaseButton messageId={messageId} />
          </div>
        ) : (
          <>
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
          </>
        )}

        <span className="mt-1 block text-xs text-zinc-400">{createdAt}</span>
      </div>
    </div>
  )
}