import { redirect } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { listCreatorPayments } from "@/modules/payment/server/list-creator-payments"

import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"

function formatPrice(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amountCents / 100)
}

export default async function DashboardPaymentsPage() {
  let user: Awaited<ReturnType<typeof requireUser>>

  try {
    user = await requireUser()
  } catch {
    redirect("/sign-in?next=/dashboard/payments")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    redirect("/become-creator")
  }

  const payments = await listCreatorPayments({
    creatorId: creator.id,
  })

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="border-b border-zinc-200 pb-4">
            <p className="text-2xl font-semibold tracking-tight text-zinc-900">
              Payment history
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Your recent payment activity.
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No payments yet"
                description="Once you start getting subscribers, payments will show up here."
              />
            </div>
          ) : (
            <div className="mt-6 divide-y divide-zinc-200">
              {payments.map((payment) => (
                <div
                  key={payment.id}
               className="flex items-start justify-between gap-4 rounded-xl py-4 transition-all duration-200 hover:-mx-3 hover:bg-zinc-50 hover:px-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-zinc-700">
                      {payment.user_id}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {new Date(payment.created_at).toLocaleString()}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-[#C2185B] tabular-nums">
                    {formatPrice(payment.amount_cents ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}