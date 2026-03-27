import { redirect } from "next/navigation"

import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { requireUser } from "@/modules/auth/server/require-user"
import { listNotifications } from "@/modules/notification/server/list-notifications"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"

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

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect("/verify-pass")
  }

  const notifications = await listNotifications({
    userId: user.id,
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
            Notifications
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Notifications
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Stay updated on subscriptions, messages, payments, and platform
            activity.
          </p>
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
            <ul className="divide-y divide-zinc-800">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <div
                    className={`flex items-start justify-between gap-4 px-5 py-4 ${
                      notification.isRead
                        ? "bg-transparent"
                        : "bg-zinc-800"
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
                            ? "font-normal text-zinc-400"
                            : "font-semibold text-white"
                        }`}
                      >
                        {notification.message}
                      </p>

                      <p className="mt-1.5 text-xs text-zinc-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  )
}