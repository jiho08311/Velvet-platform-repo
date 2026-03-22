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
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Subscribers
        </p>
        <p className="mt-2 text-2xl font-semibold text-zinc-900">
          {subscriberCount.toLocaleString()}
        </p>
      </div>

      <div className="border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Active Subscriptions
        </p>
        <p className="mt-2 text-2xl font-semibold text-zinc-900">
          {activeSubscriptionCount.toLocaleString()}
        </p>
      </div>

      <div className="border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Monthly Revenue
        </p>
        <p className="mt-2 text-2xl font-semibold text-zinc-900">
          ₩{monthlyRevenue.toLocaleString()}
        </p>
      </div>
    </section>
  )
}