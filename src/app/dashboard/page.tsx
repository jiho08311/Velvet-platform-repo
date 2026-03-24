import Link from "next/link"
import { redirect } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getCreatorDashboardSummary } from "@/modules/analytics/server/get-creator-dashboard-summary"
import { getCreatorRecentPayments } from "@/modules/analytics/server/get-creator-recent-payments"
import { getPayoutSummary } from "@/modules/payout/server/get-payout-summary"
import { listCreatorPayouts } from "@/modules/payout/server/list-creator-payouts"

import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"

function formatPrice(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amountCents / 100)
}

export default async function DashboardPage() {
  let user: Awaited<ReturnType<typeof requireUser>>

  try {
    user = await requireUser()
  } catch {
    redirect("/sign-in?next=/dashboard")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    redirect("/become-creator")
  }

  // TODO: Stripe Connect 상태로 교체


  const summary = await getCreatorDashboardSummary(creator.id)
  const payments = await getCreatorRecentPayments(creator.id)
  const payoutSummary = await getPayoutSummary(creator.id)
  const recentPayouts = await listCreatorPayouts({ creatorId: creator.id })
    const isPayoutEnabled = Boolean(payoutSummary)

  if (!recentPayouts) return null

  const availableBalance = payoutSummary?.availableBalance ?? 0
  const pendingAmount = payoutSummary?.pendingAmount ?? 0
  const showNoPayouts = availableBalance === 0 && pendingAmount === 0

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {!isPayoutEnabled && (
          <Card className="border border-yellow-200 bg-yellow-50 p-5">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-yellow-800">
                Payout account not connected
              </p>
              <p className="text-sm text-yellow-700">
                Connect your payout account to start receiving payouts.
              </p>

              <Link
                href="/dashboard/payouts"
                className="mt-2 inline-flex w-fit rounded-xl bg-[#C2185B] px-4 py-2 text-sm font-medium text-white hover:bg-[#D81B60]"
              >
                Connect account
              </Link>
            </div>
          </Card>
        )}

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
                Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                Creator dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-zinc-500">
                Track your subscribers, revenue, payouts, and recent payment
                activity.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500">Signed in</p>
              <p className="mt-2 text-sm font-medium text-zinc-900">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-xs text-zinc-500">User ID</p>
              <p className="mt-2 text-sm text-zinc-600">{user.id}</p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-xs text-zinc-500">Creator ID</p>
              <p className="mt-2 text-sm text-zinc-600">{creator.id}</p>
            </div>
          </div>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-zinc-500">Total subscribers</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">
              {summary?.subscriberCount ?? 0}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-zinc-500">Active subscribers</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">
              {summary?.activeSubscriptionCount ?? 0}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-zinc-500">Monthly revenue</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">
              {formatPrice(summary?.monthlyRevenue ?? 0)}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-zinc-500">Recent payments</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">
              {payments?.length ?? 0}
            </p>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
              <div>
                <p className="text-lg font-semibold">Recent payments</p>
                <p className="text-sm text-zinc-500">
                  Latest payment activity from your subscribers.
                </p>
              </div>

              <Link
                href="/dashboard/payments"
                className="text-xs text-zinc-500 hover:text-[#C2185B] hover:underline"
              >
                View all
              </Link>
            </div>

            {payments.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="No payments yet"
                  description="New subscriber payments will appear here."
                />
              </div>
            ) : (
              <div className="mt-6 divide-y divide-zinc-200">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between py-4">
                    <span className="text-sm text-zinc-600">
                      {payment.user_id}
                    </span>
                    <span className="text-sm font-semibold text-[#C2185B]">
                      {formatPrice(payment.amount_cents ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-4">
            <Card>
              <p className="text-sm text-zinc-500">Available payouts</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums">
                {formatPrice(availableBalance)}
              </p>

              {showNoPayouts ? (
                <p className="mt-4 text-sm text-zinc-500">
                  No payout balance yet.
                </p>
              ) : null}
            </Card>

            <Card>
              <p className="text-sm text-zinc-500">Pending payouts</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums">
                {formatPrice(pendingAmount)}
              </p>

              {showNoPayouts ? (
                <p className="mt-4 text-sm text-zinc-500">
                  No pending payouts.
                </p>
              ) : null}
            </Card>

            <Card>
              <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
                <div>
                  <p className="text-lg font-semibold">Recent payouts</p>
                  <p className="text-sm text-zinc-500">
                    Your recent payout history.
                  </p>
                </div>

                <Link
                  href="/dashboard/payouts"
                  className="text-xs text-zinc-900 hover:text-[#C2185B] hover:underline"
                >
                  View all
                </Link>
              </div>

              {recentPayouts.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="No payouts yet"
                    description="Once you start earning, your payouts will show up here."
                  />
                </div>
              ) : (
                <div className="mt-6 divide-y divide-zinc-200">
                  {recentPayouts.slice(0, 5).map((payout) => (
                    <div key={payout.id} className="flex justify-between py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-600">
                          {new Date(payout.created_at).toLocaleString()}
                        </span>
                        <span
                          className={`text-xs ${
                            payout.status === "paid"
                              ? "text-green-600"
                              : payout.status === "failed"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {payout.status.toUpperCase()}
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-[#C2185B] tabular-nums">
                        {payout.currency} {formatPrice(payout.amount_cents ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}