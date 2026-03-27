import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { createPayoutRequest } from "@/modules/payout/server/create-payout-request"
import { getPayoutSummary } from "@/modules/payout/server/get-payout-summary"
import { listCreatorPayouts } from "@/modules/payout/server/list-creator-payouts"

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

  const user = await requireUser()
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

export default async function PayoutsPage() {
  let user: Awaited<ReturnType<typeof requireUser>>

  try {
    user = await requireUser()
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