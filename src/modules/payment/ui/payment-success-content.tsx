"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Card } from "@/shared/ui/Card"
import { Skeleton } from "@/shared/ui/Skeleton"
import type { PaymentResultPageState } from "@/modules/payment/server/payment-result-state"
import type { PaymentAccessVerification } from "@/modules/payment/types"

type ConfirmInput = {
  paymentId: string
  paymentKey?: string | null
  orderId?: string | null
  amount?: number
}

type ConfirmResponse = {
  ok?: boolean
  accessVerification?: PaymentAccessVerification
}

type SuccessDestination =
  | {
      type: "post"
      href: string
      postId: string
    }
  | {
      type: "message"
      messageId: string
    }
  | {
      type: "route"
      href: string
      requiresSubscriptionAccess: boolean
      creatorUsername?: string
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
    amount: parseAmountParam(searchParams.get("amount")),
  }
}

function parseAmountParam(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }

  const amount = Number(value)

  return Number.isFinite(amount) ? amount : undefined
}

function resolveSuccessDestination(
  searchParams: URLSearchParams
): SuccessDestination {
  const postId = searchParams.get("postId")
  const creatorUsername = searchParams.get("creatorUsername")
  const messageId = searchParams.get("messageId")

  if (postId) {
    return {
      type: "post",
      href: `/post/${postId}`,
      postId,
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
      requiresSubscriptionAccess: true,
      creatorUsername,
    }
  }

  return {
    type: "route",
    href: "/feed",
    requiresSubscriptionAccess: false,
  }
}

function assertVerifiedDestinationAccess(
  destination: SuccessDestination,
  accessVerification: PaymentAccessVerification | undefined
) {
  if (!accessVerification) {
    throw new Error("ACCESS_VERIFICATION_MISSING")
  }

  if (accessVerification.kind === "payment") {
    throw new Error("PAYMENT_ACCESS_NOT_VERIFIED")
  }

  if (destination.type === "post") {
    if (
      accessVerification.kind !== "post" ||
      accessVerification.status !== "unlocked" ||
      accessVerification.postId !== destination.postId
    ) {
      throw new Error("POST_ACCESS_NOT_VERIFIED")
    }

    return
  }

  if (destination.type === "message") {
    if (
      accessVerification.kind !== "unsupported" ||
      accessVerification.paymentType !== "ppv_message"
    ) {
      throw new Error("MESSAGE_ACCESS_NOT_VERIFIED")
    }

    return
  }

  if (destination.type === "route" && destination.requiresSubscriptionAccess) {
    if (
      accessVerification.kind !== "subscription" ||
      accessVerification.status !== "active" ||
      accessVerification.creatorUsername !== destination.creatorUsername
    ) {
      throw new Error("SUBSCRIPTION_ACCESS_NOT_VERIFIED")
    }

    return
  }
}

type PaymentSuccessContentProps = {
  resultState: PaymentResultPageState
}

export function PaymentSuccessContent({
  resultState,
}: PaymentSuccessContentProps) {
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

        const data = (await res.json()) as ConfirmResponse

        if (!data.ok) {
          throw new Error("CONFIRM_FAILED")
        }

        assertVerifiedDestinationAccess(
          destination,
          data.accessVerification
        )

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
            {resultState.title}
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {resultState.message}
          </p>

          <div className="mt-6 rounded-2xl border border-green-900/60 bg-green-950/60 px-4 py-3 text-sm text-green-300">
            {resultState.notice}
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
