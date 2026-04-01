import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { updateCreatorSettings } from "@/modules/creator/server/update-creator-settings"
import { createPayoutRequest } from "@/modules/payout/server/create-payout-request"
import { getPayoutSummary } from "@/modules/payout/server/get-payout-summary"
import { listCreatorPayouts } from "@/modules/payout/server/list-creator-payouts"
import { SUBSCRIPTION_PRICES } from "@/modules/subscription/lib/subscription-price"

import { PayoutEmptyState } from "@/modules/payout/ui/PayoutEmptyState"
import { PayoutList } from "@/modules/payout/ui/PayoutHistoryList"

import { Card } from "@/shared/ui/Card"

function formatPrice(amount: number, currency = "KRW") {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
  }).format(amount)
}

async function requestPayoutAction(formData: FormData) {
  "use server"

  const amount = Number(formData.get("amount"))

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount")
  }

  const user = await requireActiveUser()
  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  await createPayoutRequest({
    creatorId: creator.id,
    amount,
    currency: "KRW",
  })

  revalidatePath("/dashboard/payouts")
  revalidatePath("/dashboard")
}

async function updateSubscriptionPriceAction(formData: FormData) {
  "use server"

  const price = Number(formData.get("price"))

  if (!Number.isFinite(price)) {
    throw new Error("Invalid subscription price")
  }

  const user = await requireActiveUser()
  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  await updateCreatorSettings({
    creatorId: user.id,
    subscriptionPrice: price,
  })

  revalidatePath("/dashboard/payouts")
  revalidatePath("/dashboard")
  revalidatePath(`/creator/${creator.username}`)
}

export default async function PayoutsPage() {
  let user: Awaited<ReturnType<typeof requireActiveUser>>

  try {
    user = await requireActiveUser()
  } catch {
    redirect("/sign-in?next=/dashboard/payouts")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    redirect("/become-creator")
  }

  const summary = await getPayoutSummary(creator.id)
  const payouts = await listCreatorPayouts({ creatorId: creator.id })

  if (!summary) {
    return <PayoutEmptyState />
  }

  const available = summary.availableBalance
  const pending = summary.pendingAmount

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Payouts</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your earnings and withdrawals
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <p className="text-sm text-zinc-500">Subscription price</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatPrice(creator.subscriptionPriceCents)}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Choose one fixed monthly subscription price.
            </p>

            <form
              action={updateSubscriptionPriceAction}
              className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {SUBSCRIPTION_PRICES.map((price) => {
                const isActive = creator.subscriptionPriceCents === price
                const isLongPrice = price >= 10000

                return (
                  <button
                    key={price}
                    type="submit"
                    name="price"
                    value={price}
                    className={
                      isActive
                        ? "w-full rounded-2xl border border-[#C2185B] bg-[#C2185B] px-4 py-2 text-left text-sm font-semibold text-white"
                        : "w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-left text-sm font-semibold text-white transition hover:bg-zinc-900"
                    }
                  >
                    <span
                      className={
                        isLongPrice
                          ? "-translate-x-1 inline-block"
                          : "inline-block"
                      }
                    >
                      ₩{price.toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </form>
          </Card>

          <Card>
            <p className="text-sm text-zinc-500">Available balance</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatPrice(available)}
            </p>

            <form action={requestPayoutAction} className="mt-4 space-y-2">
              <input
                name="amount"
                type="number"
                min={1}
                max={available}
                step={1}
                placeholder="출금 금액 입력"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#C2185B]"
                required
              />

              <button
                type="submit"
                disabled={available === 0}
                className="w-full rounded-2xl bg-[#C2185B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                Request payout
              </button>
            </form>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <p className="text-sm text-zinc-500">Pending payouts</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatPrice(pending)}
            </p>
          </Card>
        </div>

        <Card>
          <div className="mb-4">
            <p className="text-lg font-semibold text-white">Payout history</p>
            <p className="text-sm text-zinc-500">
              Track all your payout activity
            </p>
          </div>

          {payouts.length === 0 ? (
            <PayoutEmptyState />
          ) : (
            <PayoutList
              payouts={payouts.map((p) => ({
                id: p.id,
                amountCents: p.amount_cents ?? 0,
                currency: p.currency,
                status: p.status,
                createdAt: p.created_at,
                paidAt: p.paid_at,
                failureReason: p.failure_reason,
              }))}
            />
          )}
        </Card>
      </div>
    </main>
  )
}