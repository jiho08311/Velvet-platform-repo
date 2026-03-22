import Link from "next/link"

import { requireUser } from "@/modules/auth/server/require-user"
import { listNotifications } from "@/modules/notification/server/list-notifications"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"

function getNotificationText(notification: {
  message?: string
  title?: string
}) {
  if (typeof notification.message === "string") {
    return notification.message
  }

  if (typeof notification.title === "string") {
    return notification.title
  }

  return ""
}

function getNotificationTone(type: string) {
  switch (type) {
    case "subscription":
      return "success"
    case "payment":
      return "success"
    case "message":
      return "warning"
    case "system":
      return "default"
    default:
      return "default"
  }
}

export default async function NotificationsPage() {
  const user = await requireUser()
  const notifications = await listNotifications({
    userId: user.id,
  })

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-[#FCE4EC] via-white to-[#FFF1F5] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
              Notifications
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Stay updated on subscriptions, messages, payments, and platform
              activity.
            </p>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          {notifications.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No notifications yet"
                description="New updates will appear here as they happen."
              />
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={`/notifications/${notification.id}`}
                    className={`flex items-start justify-between gap-4 px-5 py-4 transition-all duration-200 ease-out ${
                      notification.isRead
                        ? "bg-transparent hover:bg-zinc-100"
                        : "bg-[#FFF1F5] hover:bg-[#FCE4EC]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          label={notification.type}
                          tone={getNotificationTone(notification.type)}
                        />
                        {!notification.isRead ? (
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#C2185B]" />
                        ) : null}
                      </div>

                      <p
                        className={`mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 ${
                          notification.isRead
                            ? "font-normal text-zinc-500"
                            : "font-semibold text-zinc-900"
                        }`}
                      >
                        {getNotificationText(notification)}
                      </p>

                      <p className="mt-1.5 text-xs text-zinc-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  )
}