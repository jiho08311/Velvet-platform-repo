import Link from "next/link"
import { redirect } from "next/navigation"

import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { getSession } from "@/modules/auth/server/get-session"
import { getNotificationById } from "@/modules/notification/server/get-notification-by-id"
import { markNotificationRead } from "@/modules/notification/server/mark-notification-read"
import type { NotificationType } from "@/modules/notification/types"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"

type NotificationDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getNotificationLabel(type: NotificationType) {
  switch (type) {
    case "subscription_started":
      return "Subscription"
    case "ppv_message_received":
      return "PPV Message"
    case "ppv_message_purchased":
      return "Purchase"
    case "payment_succeeded":
      return "Payment"
    default:
      return "Notification"
  }
}

export default async function NotificationDetailPage({
  params,
}: NotificationDetailPageProps) {
  const { id } = await params

  const session = await getSession()

  if (!session) {
    redirect("/sign-in?next=/notifications")
  }

  const userId =
    (session as any)?.userId ?? (session as any)?.user?.id ?? null

  if (!userId) {
    redirect("/sign-in?next=/notifications")
  }

  try {
    await assertPassVerified({ profileId: userId })
  } catch {
    redirect("/verify-pass")
  }

  let notification = await getNotificationById({
    notificationId: id,
    userId,
  })

  if (notification && !notification.isRead) {
    await markNotificationRead(notification.id, userId)

    notification = await getNotificationById({
      notificationId: id,
      userId,
    })
  }

  if (!notification) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <Link
            href="/notifications"
            className="inline-flex w-fit items-center rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
          >
            ← Back
          </Link>

          <Card className="p-10">
            <EmptyState
              title="Notification not found"
              description="This notification does not exist or is no longer available."
            />
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href="/notifications"
            className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
          >
            ← Back
          </Link>

          <StatusBadge label={notification.isRead ? "read" : "unread"} />
        </div>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F472B6]">
              Notification
            </p>

            <h1 className="mt-3 text-2xl font-semibold text-white">
              {getNotificationLabel(notification.type)}
            </h1>

            <p className="mt-3 text-sm text-zinc-400">
              {formatDate(notification.createdAt)}
            </p>
          </div>

          <div className="p-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Content
              </p>

              <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-zinc-200">
                {notification.body}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}