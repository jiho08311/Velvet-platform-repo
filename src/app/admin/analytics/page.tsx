import { Card } from "@/shared/ui/Card"

export default function AdminAnalyticsPage() {
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

      <Card>
        <p className="text-sm text-zinc-500">Coming soon</p>
        <p className="mt-2 text-white">
          Analytics dashboard will be available soon.
        </p>
      </Card>
    </div>
  )
}