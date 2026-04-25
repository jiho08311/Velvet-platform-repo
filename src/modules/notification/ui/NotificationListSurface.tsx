import Link from "next/link"

import type { NotificationListItem } from "../types"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"

type NotificationListSurfaceProps = {
  notifications: NotificationListItem[]
  unreadCount: number
  selectedNotificationId?: string | null
}

export function NotificationListSurface({
  notifications,
  unreadCount,
  selectedNotificationId = null,
}: NotificationListSurfaceProps) {
  return (
    <>
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
              Stay updated on likes, comments, subscriptions, messages, and payments.
            </p>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
            {unreadCount} unread
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="New updates will appear here as they happen."
          />
        ) : (
          <ul className="divide-y divide-zinc-800">
            {notifications.map((notification) => {
              const isSelected = notification.id === selectedNotificationId

              return (
                <li key={notification.id}>
                  <Link
                    href={`/notifications/${notification.id}`}
                    className={`block px-5 py-4 transition hover:bg-zinc-900/80 ${
                      isSelected
                        ? "bg-zinc-900 ring-1 ring-inset ring-zinc-700"
                        : notification.isRead
                          ? "bg-transparent"
                          : "bg-zinc-800/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            label={notification.label}
                            tone={notification.tone}
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
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
