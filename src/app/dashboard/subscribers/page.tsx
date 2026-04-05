import Link from "next/link"
import { redirect } from "next/navigation"

import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getOrCreateConversation } from "@/modules/message/server/get-or-create-conversation"
import { sendMessage } from "@/modules/message/server/send-message"
import { getCreatorSubscribers } from "@/modules/subscription/server/get-creator-subscribers"
import { Card } from "@/shared/ui/Card"

function formatSubscribedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

async function broadcastMessageAction(formData: FormData) {
  "use server"

  const content = String(formData.get("content") || "").trim()

  if (!content) {
    throw new Error("Message is required")
  }

  const user = await requireActiveUser()
  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  const { items: subscribers } = await getCreatorSubscribers({
    creatorId: creator.id,
    limit: 100,
  })

  for (const subscriber of subscribers) {
    const conversation = await getOrCreateConversation({
      userAId: user.id,
      userBId: subscriber.viewerUserId,
    })

    await sendMessage({
      conversationId: conversation.id,
      senderId: user.id,
      content,
    })
  }

  redirect("/dashboard/subscribers?sent=1")
}

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams?: Promise<{ sent?: string }>
}) {
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

  const params = searchParams ? await searchParams : undefined
  const isSent = params?.sent === "1"

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

        {isSent ? (
          <Card className="border border-green-500/30 bg-green-500/10">
            <div className="py-1">
              <p className="text-sm font-semibold text-green-400">
                발송 완료
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                전체 구독자에게 메시지를 보냈습니다
              </p>
            </div>
          </Card>
        ) : null}

        <Card>
          <form action={broadcastMessageAction} className="space-y-3">
            <div>
              <p className="text-sm font-medium text-white">전체 메시지 보내기</p>
              <p className="mt-1 text-sm text-zinc-500">
                활성 구독자 전체에게 동일한 메시지를 보냅니다
              </p>
            </div>

            <textarea
              name="content"
              rows={4}
              placeholder="모든 구독자에게 보낼 메시지를 입력하세요"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#C2185B]"
              required
            />

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#C2185B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
            >
              전체 발송
            </button>
          </form>
        </Card>

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