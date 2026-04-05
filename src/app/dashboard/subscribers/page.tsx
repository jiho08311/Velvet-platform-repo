import Link from "next/link"
import { redirect } from "next/navigation"

import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getCreatorSubscribers } from "@/modules/subscription/server/get-creator-subscribers"
import { Card } from "@/shared/ui/Card"

function formatSubscribedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

export default async function SubscribersPage() {
  let user: Awaited<ReturnType<typeof requireActiveUser>>

  try {
    user = await requireActiveUser()
  } catch {
    redirect("/sign-in?next=/dashboard/subscribers")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    redirect("/become-creator")
  }

  const { items: subscribers } = await getCreatorSubscribers({
    creatorId: creator.id,
    limit: 50,
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">구독자</h1>
          <p className="mt-1 text-sm text-zinc-500">
            현재 활성 구독자 목록을 확인하고 바로 메시지를 시작하세요
          </p>
        </div>

        {subscribers.length === 0 ? (
          <Card>
            <div className="py-10 text-center">
              <p className="text-base font-medium text-white">
                아직 활성 구독자가 없습니다
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                구독자가 생기면 여기에서 바로 확인할 수 있습니다
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {subscribers.map((subscriber) => {
              const name = subscriber.displayName || subscriber.username || "User"
              const initial = name.slice(0, 1).toUpperCase()

              return (
            <Link
  key={subscriber.subscriptionId}
  href={`/messages?userId=${subscriber.viewerUserId}`}
  className="block"
>
                  <Card className="transition hover:border-zinc-700 hover:bg-zinc-900/70">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 text-sm font-semibold text-white">
                        {subscriber.avatarUrl ? (
                          <img
                            src={subscriber.avatarUrl}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initial
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {name}
                        </p>
                        <p className="truncate text-sm text-zinc-500">
                          @{subscriber.username}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs text-zinc-500">구독 시작</p>
                        <p className="text-sm text-white">
                          {formatSubscribedAt(subscriber.subscribedAt)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}