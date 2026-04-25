import { requireCreatorReadyUser } from "@/modules/creator/server/require-creator-ready-user"
import { readCreatorOperationalReadiness } from "@/modules/creator/server/read-creator-operational-readiness"
import { listCreatorPayments } from "@/modules/payment/server/list-creator-payments"

import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 2,
  }).format(amount)
}

export default async function DashboardPaymentsPage() {
  const { user } = await requireCreatorReadyUser({
    signInNext: "/dashboard/payments",
  })
  const readiness = await readCreatorOperationalReadiness({
    userId: user.id,
  })

  if (!readiness.ok) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-white">
            승인 대기중입니다
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            현재 크리에이터 신청이 검토 중입니다. 승인 후 기능을 이용할 수 있습니다.
          </p>
        </div>
      </main>
    )
  }

  const { creator } = readiness

  const payments = await listCreatorPayments({
    creatorId: creator.id,
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="p-5 sm:p-6">
          <div className="border-b border-zinc-800 pb-4">
            <p className="text-2xl font-semibold tracking-tight text-white">
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
            <div className="mt-6 divide-y divide-zinc-800">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-start justify-between gap-4 rounded-xl py-4 transition-all duration-200 hover:-mx-3 hover:bg-zinc-950 hover:px-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-zinc-300">
                      {payment.user_id}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {new Date(payment.created_at).toLocaleString()}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-[#F472B6] tabular-nums">
                    {formatPrice(payment.amount ?? 0)}
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
