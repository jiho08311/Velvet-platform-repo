import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import { listSubscriptions } from "@/modules/subscription/server/list-subscriptions"

type SubscriberListItem = {
  id: string
  username: string
  displayName: string
  status: "active" | "canceled" | "expired"
  startedAt: string
  avatarUrl: string | null
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value))
}

function getStatusClassName(status: SubscriberListItem["status"]) {
  if (status === "active") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
  }

  if (status === "canceled") {
    return "bg-amber-500/15 text-amber-300 border-amber-500/20"
  }

  return "bg-zinc-700/40 text-zinc-300 border-zinc-700"
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

function normalizeStatus(value: string | null): SubscriberListItem["status"] {
  if (value === "active") {
    return "active"
  }

  if (value === "canceled" || value === "cancelled") {
    return "canceled"
  }

  return "expired"
}

function normalizeSubscriber(
  item: unknown,
  index: number
): SubscriberListItem | null {
  if (!item || typeof item !== "object") {
    return null
  }

  const source = item as Record<string, unknown>

  const id =
    getStringValue(source, ["userId", "subscriberId", "id"]) ??
    `subscriber_${index + 1}`

  const username =
    getStringValue(source, ["username", "userUsername", "subscriberUsername"]) ??
    "unknown"

  const displayName =
    getStringValue(source, [
      "displayName",
      "display_name",
      "userDisplayName",
      "subscriberDisplayName",
      "name",
    ]) ?? "Unknown user"

  const status = normalizeStatus(
    getStringValue(source, ["status", "subscriptionStatus"])
  )

  const startedAt =
    getStringValue(source, [
      "startedAt",
      "started_at",
      "createdAt",
      "created_at",
      "currentPeriodStartAt",
      "current_period_start",
      "subscribedAt",
      "subscribed_at",
    ]) ?? new Date().toISOString()

  const avatarUrl = getStringValue(source, [
    "avatarUrl",
    "avatar_url",
    "userAvatarUrl",
    "subscriberAvatarUrl",
  ])

  return {
    id,
    username,
    displayName,
    status,
    startedAt,
    avatarUrl,
  }
}

function normalizeSubscribers(data: unknown) {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item, index) => normalizeSubscriber(item, index))
    .filter((item): item is SubscriberListItem => item !== null)
}

export default async function CreatorSubscribersPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect("/login")
  }

  const subscriptionsData = await listSubscriptions(userId)
  const subscribers = normalizeSubscribers(subscriptionsData)

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Creator
          </p>
          <h1 className="text-3xl font-semibold text-white">Subscribers</h1>
          <p className="text-sm text-zinc-400">
            Review users who are subscribed to your creator account.
          </p>
        </div>

        {subscribers.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h2 className="text-2xl font-semibold text-white">
              No subscribers yet
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Subscriber activity will appear here when users start subscribing.
            </p>
          </section>
        ) : (
          <section className="grid gap-4">
            {subscribers.map((subscriber) => (
              <article
                key={subscriber.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-lg font-semibold text-white">
                      {subscriber.avatarUrl ? (
                        <img
                          src={subscriber.avatarUrl}
                          alt={subscriber.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        subscriber.displayName.slice(0, 1)
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-lg font-semibold text-white">
                          {subscriber.displayName}
                        </h2>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusClassName(
                            subscriber.status
                          )}`}
                        >
                          {subscriber.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-zinc-400">
                        @{subscriber.username}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300">
                    Started at {formatDate(subscriber.startedAt)}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}