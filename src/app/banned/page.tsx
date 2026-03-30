import { Card } from "@/shared/ui/Card"

export default function BannedPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <Card>
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-950/60 text-red-300">
              !
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-white">
                Account Banned
              </h1>
              <p className="text-sm leading-6 text-zinc-400">
                Your account has been restricted by the platform administrator.
                If you believe this was a mistake, please contact support.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}