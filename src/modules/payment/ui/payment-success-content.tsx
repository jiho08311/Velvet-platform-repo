"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Card } from "@/shared/ui/Card"
import { Skeleton } from "@/shared/ui/Skeleton"

type ConfirmInput = {
  paymentId: string
  paymentKey?: string | null
  orderId?: string | null
  amount?: string | null
}

type SuccessDestination =
  | {
      type: "post"
      href: string
    }
  | {
      type: "message"
      messageId: string
    }
  | {
      type: "route"
      href: string
    }

function resolveConfirmInput(
  searchParams: URLSearchParams
): ConfirmInput | null {
  const paymentIdParam = searchParams.get("paymentId")
  const orderId = searchParams.get("orderId")
  const paymentId = paymentIdParam || orderId

  if (!paymentId) {
    return null
  }

  return {
    paymentId,
    paymentKey: searchParams.get("paymentKey"),
    orderId,
    amount: searchParams.get("amount"),
  }
}

function resolveSuccessDestination(
  searchParams: URLSearchParams
): SuccessDestination {
  const postId = searchParams.get("postId")
  const creatorUsername = searchParams.get("creatorUsername")
  const messageId = searchParams.get("messageId")

  if (postId && creatorUsername) {
    return {
      type: "route",
      href: `/creator/${creatorUsername}`,
    }
  }

  if (postId) {
    return {
      type: "post",
      href: `/post/${postId}`,
    }
  }

  if (messageId) {
    return {
      type: "message",
      messageId,
    }
  }

  if (creatorUsername) {
    return {
      type: "route",
      href: `/creator/${creatorUsername}`,
    }
  }

  return {
    type: "route",
    href: "/feed",
  }
}

export function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const confirmInput = resolveConfirmInput(searchParams)

    if (!confirmInput) {
      router.replace("/payment/fail?reason=invalid_request")
      return
    }

    const destination = resolveSuccessDestination(searchParams)

    const confirm = async () => {
      try {
        const res = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(confirmInput),
        })

        if (!res.ok) {
          throw new Error("CONFIRM_FAILED")
        }

        const data = await res.json()

        if (!data.ok) {
          throw new Error("CONFIRM_FAILED")
        }

        if (destination.type === "post") {
          router.replace(destination.href)
          return
        }

        if (destination.type === "message") {
          const conversationRes = await fetch(
            `/api/message/conversation-by-message?messageId=${destination.messageId}`,
            {
              method: "GET",
              cache: "no-store",
            }
          )

          if (conversationRes.ok) {
            const conversationData = await conversationRes.json()

            if (conversationData?.conversationId) {
              router.replace(`/messages/${conversationData.conversationId}`)
              return
            }
          }

          router.replace("/messages")
          router.refresh()
          return
        }

        router.replace(destination.href)
      } catch (error) {
        console.error("confirm failed:", error)
        router.replace("/payment/fail?reason=verification_failed")
      }
    }

    confirm()
  }, [searchParams, router])

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-900/40 text-xl text-green-400">
            ✓
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            결제 처리 중이에요
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            결제 확인을 진행하고 있어요. 잠시만 기다려 주세요.
          </p>

          <div className="mt-6 rounded-2xl border border-green-900/60 bg-green-950/60 px-4 py-3 text-sm text-green-300">
            완료되면 자동으로 반영돼요.
          </div>

          <div className="mt-6 space-y-3">
            <div className="space-y-2">
              <Skeleton height={10} width="100%" rounded="rounded-full" />
              <Skeleton height={10} width="72%" rounded="rounded-full" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/feed"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#C2185B] px-5 text-sm font-medium text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
              >
                피드로 이동
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}