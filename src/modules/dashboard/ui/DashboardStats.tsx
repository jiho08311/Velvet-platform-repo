type DashboardStatsProps = {
  subscriberCount: number
  activeSubscriptionCount: number
  monthlyRevenue: number
}

export function DashboardStats({
  subscriberCount,
  activeSubscriptionCount,
  monthlyRevenue,
}: DashboardStatsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <div className="border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-zinc-500">Subscribers</p>
        <p className="mt-1 text-lg font-semibold text-zinc-900">
          {subscriberCount}
        </p>
      </div>

      <div className="border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-zinc-500">Active Subscriptions</p>
        <p className="mt-1 text-lg font-semibold text-zinc-900">
          {activeSubscriptionCount}
        </p>
      </div>

      <div className="border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-zinc-500">Monthly Revenue</p>
        <p className="mt-1 text-lg font-semibold text-zinc-900">
          ₩{monthlyRevenue.toLocaleString()}
        </p>
      </div>
    </section>
  )
}