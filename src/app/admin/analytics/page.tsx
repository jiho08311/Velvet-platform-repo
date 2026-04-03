import { Card } from "@/shared/ui/Card"
import { getAnalytics } from "@/modules/payment/server/get-analytics"

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function AdminAnalyticsPage() {
  const analytics = await getAnalytics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Analytics
        </h1>
        <p className="text-sm text-zinc-500">
          Platform insights and metrics
        </p>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-zinc-500">Total revenue</p>
          <p className="mt-2 text-2xl font-semibold text-white">
           formatMoney(analytics.totalNetRevenue)
          </p>
        </Card>

        <Card>
          <p className="text-sm text-zinc-500">Available</p>
          <p className="mt-2 text-2xl font-semibold text-white">
         formatMoney(analytics.availableRevenue)
          </p>
        </Card>

        <Card>
          <p className="text-sm text-zinc-500">Paid out</p>
          <p className="mt-2 text-2xl font-semibold text-white">
          formatMoney(analytics.paidOutRevenue)
          </p>
        </Card>

        <Card>
          <p className="text-sm text-zinc-500">Active subs</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {analytics.activeSubscriptionsCount}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-zinc-500">Total subs</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {analytics.totalSubscriptionsCount}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-zinc-500">Payments</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {analytics.successfulPaymentsCount}
          </p>
        </Card>
      </div>

      {/* Recent payments */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">
            Recent payments
          </h2>
        </div>

        {analytics.recentPayments.length === 0 ? (
          <p className="text-sm text-zinc-500">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500">
                <tr>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800">
                {analytics.recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 text-white">{p.type}</td>
                    <td className="py-3 text-zinc-400">{p.status}</td>
                    <td className="py-3 text-zinc-300">
                      {formatMoney(p.amount)}
                    </td>
                    <td className="py-3 text-zinc-500">
                      {p.user_id.slice(0, 8)}
                    </td>
                    <td className="py-3 text-zinc-500">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}