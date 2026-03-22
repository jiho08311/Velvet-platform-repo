import { Card } from "@/shared/ui/Card"
import { Skeleton } from "@/shared/ui/Skeleton"

export default function DashboardPayoutsLoadingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-2">
          <Skeleton width={220} height={32} rounded="rounded-2xl" />
          <Skeleton width={320} height={16} />
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card
              key={index}
              className="rounded-3xl border border-zinc-200 bg-white p-5"
            >
              <Skeleton width={96} height={12} />
              <Skeleton
                width={120}
                height={32}
                rounded="rounded-2xl"
                className="mt-4"
              />
              <Skeleton width="100%" height={14} className="mt-3" />
            </Card>
          ))}
        </section>

        <Card className="rounded-3xl border border-zinc-200 bg-white p-5">
          <div className="border-b border-zinc-200 pb-4">
            <Skeleton width={180} height={24} rounded="rounded-2xl" />
            <Skeleton width={260} height={16} className="mt-2" />
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50">
            <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b border-zinc-200 bg-white px-4 py-3 sm:grid">
              <Skeleton width={72} height={12} />
              <Skeleton width={56} height={12} />
              <Skeleton width={56} height={12} />
            </div>

            <div className="divide-y divide-zinc-200">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
                >
                  <div>
                    <Skeleton width={140} height={16} />
                    <Skeleton width={96} height={12} className="mt-2" />
                  </div>

                  <div className="sm:text-right">
                    <Skeleton width={80} height={16} />
                  </div>

                  <div className="sm:text-right">
                    <Skeleton
                      width={88}
                      height={32}
                      rounded="rounded-full"
                      className="bg-[#FEF3C7]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}