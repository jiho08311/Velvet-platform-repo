import Link from "next/link"
import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import {
  buildPathWithNext,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff"
import {
  listUserSubscriptions,
  type UserSubscriptionListItem,
} from "@/modules/subscription/server/list-user-subscriptions"
import { EmptyState } from "@/shared/ui/EmptyState"

function formatDate(value?: string | null) {
  if (!value) return "N/A"

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value))
}

function getStatusClassName(status: UserSubscriptionListItem["status"]) {
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

export default async function SubscriptionsPage() {
  const nextPath = "/subscriptions"
  const session = await getSession()

  if (!session) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  const subscriptions = await listUserSubscriptions(userId)

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
          <EmptyState
            title="No subscriptions yet"
            description="Once you subscribe to creators, they will appear here."
            actionLabel="Explore creators"
            actionHref="/explore"
          />
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
                      className="inline-flex items-center rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                    >
                      View creator
                    </Link>
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
