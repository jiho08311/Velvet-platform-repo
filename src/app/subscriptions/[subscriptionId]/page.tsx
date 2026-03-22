import Link from "next/link"
import { getSubscriptionById } from "@/modules/subscription/server/get-subscription-by-id"

type SubscriptionDetailPageProps = {
  params: Promise<{
    subscriptionId: string
  }>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getStatusClassName(status: "active" | "canceled" | "expired") {
  if (status === "active") {
    return "border-emerald-500/20 bg-emerald-500/15 text-emerald-300"
  }

  if (status === "canceled") {
    return "border-amber-500/20 bg-amber-500/15 text-amber-300"
  }

  return "border-zinc-700 bg-zinc-800/70 text-zinc-300"
}

export default async function SubscriptionDetailPage({
  params,
}: SubscriptionDetailPageProps) {
  const { subscriptionId } = await params
  const subscription = await getSubscriptionById(subscriptionId)

  if (!subscription) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <Link
            href="/subscriptions"
            className="inline-flex w-fit items-center rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
          >
            ← Back to subscriptions
          </Link>

          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-10 text-center">
            <h1 className="text-2xl font-semibold text-white">
              Subscription not found
            </h1>
            <p className="mt-3 text-sm text-zinc-400">
              This subscription does not exist or is no longer available.
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/subscriptions"
            className="inline-flex items-center rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
          >
            ← Back
          </Link>

          <button
            type="button"
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
          >
            Unsubscribe
          </button>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-2xl font-semibold text-white">
                {subscription.creator.avatarUrl ? (
                  <img
                    src={subscription.creator.avatarUrl}
                    alt={subscription.creator.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  subscription.creator.displayName.slice(0, 1).toUpperCase()
                )}
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  Creator
                </p>
                <h1 className="mt-1 text-3xl font-semibold text-white">
                  {subscription.creator.displayName}
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  @{subscription.creator.username}
                </p>
              </div>
            </div>

            <div
              className={`w-fit rounded-full border px-4 py-2 text-sm font-medium capitalize ${getStatusClassName(
                subscription.status
              )}`}
            >
              {subscription.status}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Started at
              </p>
              <p className="mt-3 text-base text-zinc-200">
                {formatDate(subscription.startedAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Renewal
              </p>
              <p className="mt-3 text-base text-zinc-200">
                {subscription.billing.renewalDate
                  ? formatDate(subscription.billing.renewalDate)
                  : "No renewal scheduled"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Billing plan
              </p>
              <p className="mt-3 text-base text-zinc-200">
                {subscription.billing.planLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Price
              </p>
              <p className="mt-3 text-base text-zinc-200">
                {subscription.billing.amountLabel}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/creator/${subscription.creator.username}`}
              className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              View creator page
            </Link>

            <button
              type="button"
              className="rounded-full border border-zinc-700 px-5 py-3 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              Manage billing
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}