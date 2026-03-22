import { Card } from "@/shared/ui/Card"
import { Skeleton } from "@/shared/ui/Skeleton"
import { SkeletonCard } from "@/shared/ui/SkeletonCard"

export default function DashboardLoadingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-[#FCE4EC] via-white to-[#FFF1F5] p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1">
                <Skeleton width={96} height={12} className="bg-[#F8BBD0]" />
                <Skeleton width={260} height={40} rounded="rounded-2xl" className="mt-4" />
                <Skeleton width="100%" height={16} className="mt-3 max-w-xl" />
                <Skeleton width="100%" height={16} className="mt-2 max-w-lg" />
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                <Skeleton width={64} height={12} />
                <Skeleton width={160} height={16} className="mt-3" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <Skeleton width={56} height={12} />
              <Skeleton width="100%" height={16} className="mt-3" />
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <Skeleton width={80} height={12} />
              <Skeleton width="100%" height={16} className="mt-3" />
            </div>
          </div>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard
              key={index}
              showAvatar={false}
              lines={2}
              className="[&>div]:space-y-0"
            />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card className="rounded-3xl border border-zinc-200 bg-white p-5">
            <div className="border-b border-zinc-200 pb-4">
              <Skeleton width={160} height={24} rounded="rounded-2xl" />
              <Skeleton width={288} height={16} className="mt-2" />
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50">
              <div className="hidden grid-cols-[1.4fr_auto] gap-4 border-b border-zinc-200 bg-white px-4 py-3 sm:grid">
                <Skeleton width={40} height={12} />
                <div className="ml-auto">
                  <Skeleton width={56} height={12} />
                </div>
              </div>

              <div className="divide-y divide-zinc-200">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="grid gap-3 px-4 py-4 sm:grid-cols-[1.4fr_auto] sm:items-center sm:gap-4"
                  >
                    <div>
                      <Skeleton
                        width={40}
                        height={12}
                        className="sm:hidden"
                      />
                      <Skeleton
                        width="100%"
                        height={16}
                        className="mt-2 max-w-xs sm:mt-0"
                      />
                    </div>

                    <div className="sm:text-right">
                      <Skeleton
                        width={48}
                        height={12}
                        className="sm:hidden"
                      />
                      <Skeleton
                        width={80}
                        height={32}
                        rounded="rounded-full"
                        className="mt-2 inline-flex bg-[#FCE4EC] sm:mt-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid gap-4">
            <SkeletonCard
              showAvatar={false}
              lines={2}
              className="[&>div]:space-y-0"
            />
            <SkeletonCard
              showAvatar={false}
              lines={2}
              className="[&>div]:space-y-0"
            />
          </div>
        </section>
      </div>
    </main>
  )
}