import Link from "next/link"
import { redirect } from "next/navigation"

import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { requireUser } from "@/modules/auth/server/require-user"
import { listNotifications } from "@/modules/notification/server/list-notifications"
import type { NotificationType } from "@/modules/notification/types"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"

function getNotificationTone(type: NotificationType) {
  switch (type) {
    case "subscription_started":
      return "success"
    case "ppv_message_received":
      return "warning"
    case "ppv_message_purchased":
      return "success"
    case "ppv_post_purchased":
      return "success"
    case "payment_succeeded":
      return "success"
    default:
      return "default"
  }
}

function getNotificationLabel(type: NotificationType) {
  switch (type) {
    case "subscription_started":
      return "Subscription"
    case "ppv_message_received":
      return "PPV Message"
    case "ppv_message_purchased":
      return "Purchase"
    case "ppv_post_purchased":
      return "Post Purchase"
    case "payment_succeeded":
      return "Payment"
    default:
      return "Notification"
  }
}

export default async function NotificationsPage() {
  const user = await requireUser()

  console.log("[notifications/page] current user id:", user.id)

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect("/verify-pass")
  }

  const notifications = await listNotifications({
    userId: user.id,
  })

  console.log("[notifications/page] notifications count:", notifications.length)
  console.log("[notifications/page] notifications:", notifications)

  const unreadCount = notifications.filter((item) => !item.isRead).length

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                Notifications
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Notifications
              </h1>

              <p className="mt-2 text-sm text-zinc-400">
                Stay updated on subscriptions, PPV messages, and successful
                payments.
              </p>

              <p className="mt-3 text-xs text-red-400">
                current user id: {user.id}
              </p>
            </div>

            <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
              {unreadCount} unread
            </div>
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
            <ul className="divide-y divide-zinc-800">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={`/notifications/${notification.id}`}
                    className={`block px-5 py-4 transition hover:bg-zinc-900/80 ${
                      notification.isRead ? "bg-transparent" : "bg-zinc-800/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            label={getNotificationLabel(notification.type)}
                            tone={getNotificationTone(notification.type)}
                          />
                          {!notification.isRead ? (
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#C2185B]" />
                          ) : null}
                        </div>

                        <p
                          className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${
                            notification.isRead
                              ? "font-normal text-zinc-400"
                              : "font-semibold text-white"
                          }`}
                        >
                          {notification.body}
                        </p>

                        <p className="mt-1.5 text-xs text-zinc-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>

                        <p className="mt-1 text-[11px] text-zinc-600">
                          user_id: {notification.userId}
                        </p>
                      </div>
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