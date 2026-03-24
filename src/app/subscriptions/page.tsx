import Link from "next/link"
import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import { listSubscriptions } from "@/modules/subscription/server/list-subscriptions"

type SubscriptionListItem = {
  id: string
  status: "active" | "canceled" | "expired"
  startedAt: string
  creator: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value))
}

function getStatusClassName(status: SubscriptionListItem["status"]) {
  if (status === "active") {
    return "border-emerald-500/20 bg-emerald-500/15 text-emerald-300"
  }

  if (status === "canceled") {
    return "border-amber-500/20 bg-amber-500/15 text-amber-300"
  }

  return "border-zinc-700 bg-zinc-800/70 text-zinc-300"
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

function normalizeStatus(value: string | null): SubscriptionListItem["status"] {
  if (value === "active") {
    return "active"
  }

  if (value === "canceled" || value === "cancelled") {
    return "canceled"
  }

  return "expired"
}

function normalizeSubscription(
  item: unknown,
  index: number
): SubscriptionListItem | null {
  if (!item || typeof item !== "object") {
    return null
  }

  const source = item as Record<string, unknown>

  const id =
    getStringValue(source, ["id", "subscriptionId"]) ??
    `subscription_${index + 1}`

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
    ]) ?? new Date().toISOString()

  const creatorId =
    getStringValue(source, ["creatorId", "creator_id"]) ?? ""

  const creatorUsername =
    getStringValue(source, [
      "creatorUsername",
      "creator_username",
      "username",
    ]) ?? "unknown"

  const creatorDisplayName =
    getStringValue(source, [
      "creatorDisplayName",
      "creator_display_name",
      "displayName",
      "name",
    ]) ?? "Unknown creator"

  const creatorAvatarUrl = getStringValue(source, [
    "creatorAvatarUrl",
    "creator_avatar_url",
    "avatarUrl",
    "avatar_url",
  ])

  return {
    id,
    status,
    startedAt,
    creator: {
      id: creatorId,
      username: creatorUsername,
      displayName: creatorDisplayName,
      avatarUrl: creatorAvatarUrl,
    },
  }
}

function normalizeSubscriptions(data: unknown) {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item, index) => normalizeSubscription(item, index))
    .filter((item): item is SubscriptionListItem => item !== null)
}

export default async function SubscriptionsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect("/login")
  }

  const subscriptionsData = await listSubscriptions(userId)
  const subscriptions = normalizeSubscriptions(subscriptionsData)

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Subscription
          </p>
          <h1 className="text-3xl font-semibold text-white">
            My subscriptions
          </h1>
          <p className="text-sm text-zinc-400">
            Manage creators you are currently subscribed to.
          </p>
        </div>

        {subscriptions.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-10 text-center sm:p-12">
            <h2 className="text-2xl font-semibold text-white">
              No subscriptions yet
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Once you subscribe to creators, they will appear here.
            </p>
            <Link
              href="/explore"
              className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Explore creators
            </Link>
          </section>
        ) : (
          <section className="grid gap-4">
            {subscriptions.map((subscription) => (
              <article
                key={subscription.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4 sm:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 text-base font-semibold text-white sm:h-16 sm:w-16 sm:text-lg">
                      {subscription.creator.avatarUrl ? (
                        <img
                          src={subscription.creator.avatarUrl}
                          alt={subscription.creator.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        subscription.creator.displayName
                          .slice(0, 1)
                          .toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-lg font-semibold text-white">
                          {subscription.creator.displayName}
                        </h2>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusClassName(
                            subscription.status
                          )}`}
                        >
                          {subscription.status}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-zinc-400">
                        @{subscription.creator.username}
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">
                        Started on {formatDate(subscription.startedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/creator/${subscription.creator.username}`}
                      className="inline-flex items-center rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
                    >
                      View creator
                    </Link>

                    <Link
                      href={`/subscriptions/${subscription.id}`}
                      className="inline-flex items-center rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
                    >
                      View subscription
                    </Link>

                    <button
                      type="button"
                      className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                    >
                      Unsubscribe
                    </button>
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