// src/app/notifications/page.tsx
import Link from "next/link"
import { redirect } from "next/navigation"

import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { listNotifications } from "@/modules/notification/server/list-notifications"
import type { NotificationType } from "@/modules/notification/types"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ProfileRow = {
  username: string | null
}

type NotificationBadgeTone =
  | "default"
  | "neutral"
  | "subtle"
  | "info"
  | "success"
  | "warning"
  | "danger"

function getNotificationTone(type: NotificationType): NotificationBadgeTone {
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
    case "post_liked":
      return "default"
    case "comment_created":
      return "default"
    case "comment_liked":
      return "default"
    case "message_received":
      return "default"
    default:
      return "default"
  }
}

function getNotificationLabel(type: NotificationType) {
  switch (type) {
    case "subscription_started":
      return "Subscription"
    case "ppv_message_received":
      return "Locked message"
    case "ppv_message_purchased":
      return "Message unlocked"
    case "ppv_post_purchased":
      return "Content unlocked"
    case "payment_succeeded":
      return "Payment"
    case "post_liked":
      return "Like"
    case "comment_created":
      return "Comment"
    case "comment_liked":
      return "Comment like"
    case "message_received":
      return "Message"
    default:
      return "Notification"
  }
}

export default async function NotificationsPage() {
  let user: Awaited<ReturnType<typeof requireActiveUser>>

  try {
    user = await requireActiveUser()
  } catch {
    redirect("/sign-in?next=/notifications")
  }

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect("/verify-pass")
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  if (profileError) {
    throw profileError
  }

  if (!profile?.username) {
    redirect("/onboarding")
  }

  const notifications = await listNotifications({
    userId: user.id,
  })

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
                Stay updated on subscriptions, locked messages, and payments.
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
                const badgeLabel = getNotificationLabel(notification.type)
                const badgeTone = getNotificationTone(notification.type)

                return (
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
                              label={badgeLabel}
                              tone={badgeTone}
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
      </div>
    </main>
  )
}