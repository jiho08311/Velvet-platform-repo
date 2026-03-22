import { MessageItem } from "./MessageItem"

type MessageListItem = {
  id: string
  content: string
  createdAt: string
  isOwn?: boolean
}

type MessageListProps = {
  messages: MessageListItem[]
  emptyMessage?: string
}

export function MessageList({
  messages,
  emptyMessage = "No messages yet.",
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          content={message.content}
          createdAt={message.createdAt}
          isOwn={message.isOwn}
        />
      ))}
    </section>
  )
}