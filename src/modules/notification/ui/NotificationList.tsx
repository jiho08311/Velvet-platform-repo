import { NotificationItem } from "./NotificationItem"

type NotificationListItem = {
  id: string
  title: string
  body: string
  createdAt: string
  isRead: boolean
}

type NotificationListProps = {
  notifications: NotificationListItem[]
  emptyMessage?: string
}

export function NotificationList({
  notifications,
  emptyMessage = "No notifications yet.",
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <div className="divide-y divide-zinc-200">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            title={notification.title}
            body={notification.body}
            createdAt={notification.createdAt}
            isRead={notification.isRead}
          />
        ))}
      </div>
    </section>
  )
}