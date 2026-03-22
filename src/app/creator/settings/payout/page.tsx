"use client"

export default function CreatorPayoutSettingsPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Payout settings</h1>

      <div className="mt-6 space-y-4 rounded-xl border p-6">
        <div>
          <p className="text-sm text-gray-500">Payout system</p>
          <p className="mt-1 text-sm">
            Payouts are currently handled manually by the platform.
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Status</p>
          <p className="mt-1 text-sm text-green-600">
            Active
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-700">
        You will receive payouts based on your earnings. The platform will process payouts manually.
      </div>
    </main>
  )
}