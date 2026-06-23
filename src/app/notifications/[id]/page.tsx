import { redirect } from "next/navigation"
import { getNotificationBadgeSummary } from "@/modules/notification/public/get-notification-badge-summary"
import { getNotificationById } from "@/modules/notification/public/get-notification-by-id"
import { listNotificationItems } from "@/modules/notification/public/list-notifications"
import { requireNotificationPageAccess } from "@/modules/notification/public/require-notification-page-access"

import { NotificationListSurface } from "@/modules/notification/public/notification-ui"

type NotificationsPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function NotificationsPage({
  params,
}: NotificationsPageProps) {
  const { id } = await params
  const nextPath = `/notifications/${id}`
 const session = await requireNotificationPageAccess("/notifications")
  const selectedNotification = await getNotificationById({
    notificationId: id,
    userId: session.userId,
  })

  const notificationItems = await listNotificationItems({
    userId: session.userId,
  })

const badgeSummary =
  await getNotificationBadgeSummary({
    userId: session.userId,
  })

const unreadCount =
  badgeSummary.unreadCount

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <NotificationListSurface
          notifications={notificationItems}
          unreadCount={unreadCount}
          selectedNotificationId={selectedNotification?.id ?? null}
        />
      </div>
    </main>
  )
}
