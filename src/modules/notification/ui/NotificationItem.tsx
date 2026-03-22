type NotificationItemProps = {
  title: string
  body: string
  createdAt: string
  isRead?: boolean
}

export function NotificationItem({
  title,
  body,
  createdAt,
  isRead = false,
}: NotificationItemProps) {
  return (
    <div
      className={`border-b border-zinc-200 px-4 py-3 ${
        isRead ? "bg-white" : "bg-[#FFF1F5]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          <p className="mt-1 text-sm text-zinc-600">{body}</p>
        </div>

        <span className="text-xs text-zinc-400">{createdAt}</span>
      </div>
    </div>
  )
}