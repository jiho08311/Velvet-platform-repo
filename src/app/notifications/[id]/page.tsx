import Link from "next/link"
import { redirect } from "next/navigation"

import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { getSession } from "@/modules/auth/server/get-session"
import { getNotificationById } from "@/modules/notification/server/get-notification-by-id"
import MarkNotificationReadButton from "@/modules/notification/ui/MarkNotificationReadButton"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"

type NotificationDetailPageProps = {
  params: {
    id: string
  }
}

type NotificationDetail = {
  id: string
  type: "subscription" | "message" | "payment" | "system"
  content: string
  createdAt: string
  relatedCreator: {
    id: string
    username: string
    displayName: string
  } | null
  relatedPost: {
    id: string
    title: string
  } | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getSessionUserId(session: unknown) {
  if (!session || typeof session !== "object") {
    return null
  }

  if ("userId" in session && typeof session.userId === "string") {
    return session.userId
  }

  if (
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof session.user.id === "string"
  ) {
    return session.user.id
  }

  return null
}

function getStringValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return null
}

function normalizeNotificationType(
  value: string | null
): NotificationDetail["type"] {
  if (value === "subscription") {
    return "subscription"
  }

  if (value === "message") {
    return "message"
  }

  if (value === "payment") {
    return "payment"
  }

  return "system"
}

function normalizeNotification(data: unknown): NotificationDetail | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const source = data as Record<string, unknown>

  const id = getStringValue(source, ["id"])
  const content = getStringValue(source, ["content", "message", "body"])
  const createdAt = getStringValue(source, ["createdAt", "created_at"])
  const type = normalizeNotificationType(getStringValue(source, ["type"]))

  if (!id || !content || !createdAt) {
    return null
  }

  const creatorId = getStringValue(source, [
    "relatedCreatorId",
    "creatorId",
    "creator_id",
  ])
  const creatorUsername = getStringValue(source, [
    "relatedCreatorUsername",
    "creatorUsername",
    "creator_username",
  ])
  const creatorDisplayName = getStringValue(source, [
    "relatedCreatorDisplayName",
    "creatorDisplayName",
    "creator_display_name",
  ])

  const postId = getStringValue(source, ["relatedPostId", "postId", "post_id"])
  const postTitle = getStringValue(source, [
    "relatedPostTitle",
    "postTitle",
    "post_title",
  ])

  return {
    id,
    type,
    content,
    createdAt,
    relatedCreator:
      creatorId && creatorUsername && creatorDisplayName
        ? {
            id: creatorId,
            username: creatorUsername,
            displayName: creatorDisplayName,
          }
        : null,
    relatedPost:
      postId && postTitle
        ? {
            id: postId,
            title: postTitle,
          }
        : null,
  }
}

export default async function NotificationDetailPage({
  params,
}: NotificationDetailPageProps) {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in?next=/notifications")
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect("/sign-in?next=/notifications")
  }

  try {
    await assertPassVerified({ profileId: userId })
  } catch {
    redirect("/verify-pass")
  }

  const { id } = params

  const notificationData = await getNotificationById({
    notificationId: id,
    userId,
  })

  const notification = normalizeNotification(notificationData)

  if (!notification) {
    return (
      <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <Link
            href="/notifications"
            className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
          >
            ← Back to notifications
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
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/notifications"
            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
          >
            ← Back
          </Link>

          <MarkNotificationReadButton notificationId={notification.id} />
        </div>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-[#FCE4EC] via-white to-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
                  Notification detail
                </p>
                <h1 className="mt-3 text-3xl font-semibold capitalize text-zinc-900">
                  {notification.type}
                </h1>
                <div className="mt-3">
                  <StatusBadge label={notification.type} />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Created at
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  {formatDate(notification.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Content
              </p>
              <p className="mt-3 text-base leading-7 text-zinc-800">
                {notification.content}
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Card className="rounded-2xl bg-zinc-50 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  Related creator
                </p>

                {notification.relatedCreator ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <div>
                      <p className="text-lg font-medium text-zinc-900">
                        {notification.relatedCreator.displayName}
                      </p>
                      <p className="text-sm text-zinc-500">
                        @{notification.relatedCreator.username}
                      </p>
                    </div>

                    <Link
                      href={`/creator/${notification.relatedCreator.username}`}
                      className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      View creator
                    </Link>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">
                    No related creator information.
                  </p>
                )}
              </Card>

              <Card className="rounded-2xl bg-zinc-50 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  Related post
                </p>

                {notification.relatedPost ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <div>
                      <p className="text-lg font-medium text-zinc-900">
                        {notification.relatedPost.title}
                      </p>
                      <p className="text-sm text-zinc-500">
                        Post ID: {notification.relatedPost.id}
                      </p>
                    </div>

                    <Link
                      href={`/post/${notification.relatedPost.id}`}
                      className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      View post
                    </Link>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">
                    No related post information.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}