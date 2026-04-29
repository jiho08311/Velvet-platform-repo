import type { ConversationMessageListItem } from "@/modules/message/types"
import { MessageItem } from "./MessageItem"

type MessageListProps = {
  messages: ConversationMessageListItem[]
  emptyMessage?: string
}

export function MessageList({
  messages,
  emptyMessage = "아직 메시지가 없습니다"
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </section>
    )
  }

  /**
   * MessageList render boundary.
   *
   * Commerce-related fields (type, price, isLocked) are passed through to
   * MessageItem for render-contract compatibility only.
   *
   * DO NOT derive or implement:
   * - purchase state
   * - unlock state
   * - paid access
   * - media access / signed URL authorization
   *
   * from these fields at this layer.
   *
   * PPV message unlock / purchase source of truth:
   * - currently unknown / unsupported
   */
  return (
    <section className="flex flex-col gap-3">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          messageId={message.id}
          content={message.content}
          createdAt={message.createdAt}
          isOwn={message.isOwn}
          media={message.media}
          type={message.type}
          price={message.price}
          isLocked={message.isLocked}
          reportPathname={message.reportPathname}
        />
      ))}
    </section>
  )
}