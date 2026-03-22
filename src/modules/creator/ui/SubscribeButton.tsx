"use client"

import { loadTossPayments } from "@tosspayments/payment-sdk"
import { useEffect, useState } from "react"

type SubscribeButtonProps = {
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
}

type SubscriptionCheckResponse = {
  subscribed?: boolean
  cancelAtPeriodEnd?: boolean
}

type CheckoutResponse = {
  payment?: {
    id?: string
    amount_cents?: number
  }
  checkout?: {
    orderId?: string
    orderName?: string
  }
  error?: string
}

function getSubscribeErrorMessage(message: string) {
  if (message === "You already have an active subscription") {
    return "이미 구독 중인 크리에이터입니다"
  }

  if (message === "You cannot subscribe to your own creator page") {
    return "본인 크리에이터 페이지는 구독할 수 없습니다"
  }

  if (message === "Invalid subscription price") {
    return "구독 가격이 올바르지 않습니다"
  }

  if (message === "Creator not found") {
    return "크리에이터를 찾을 수 없습니다"
  }

  return "구독 처리에 실패했습니다"
}

export default function SubscribeButton({
  creatorId,
  creatorUserId,
  currentUserId,
}: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)
  const [checking, setChecking] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const isOwner =
    Boolean(currentUserId) &&
    Boolean(creatorUserId) &&
    currentUserId === creatorUserId

  async function checkCreatorSubscription() {
    try {
      const res = await fetch(`/api/subscription/check?creatorId=${creatorId}`, {
        method: "GET",
        cache: "no-store",
      })

      if (!res.ok) {
        setSubscribed(false)
        setCancelAtPeriodEnd(false)
        return false
      }

      const data = (await res.json()) as SubscriptionCheckResponse

      setSubscribed(Boolean(data.subscribed))
      setCancelAtPeriodEnd(Boolean(data.cancelAtPeriodEnd))

      return Boolean(data.subscribed)
    } catch {
      setSubscribed(false)
      setCancelAtPeriodEnd(false)
      return false
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (isOwner) {
      setChecking(false)
      return
    }

    checkCreatorSubscription()
  }, [creatorId, isOwner])

  async function handleSubscribe() {
    try {
      setLoading(true)
      setErrorMessage("")

      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ creatorId }),
      })

      const data = (await res.json()) as CheckoutResponse

      if (!res.ok) {
        setErrorMessage(
          getSubscribeErrorMessage(
            data.error ?? "Failed to create payment request"
          )
        )
        return
      }

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey) {
        setErrorMessage("토스 클라이언트 키가 없습니다")
        return
      }

      const paymentId = data.payment?.id
      const amountCents = (data.payment as any)?.amountCents ?? 0
      const orderId = data.checkout?.orderId ?? paymentId
      const orderName = data.checkout?.orderName ?? "Creator subscription"

      if (!paymentId || !orderId || amountCents <= 0) {
        setErrorMessage("결제 요청 정보가 올바르지 않습니다")
        return
      }

      const tossPayments = await loadTossPayments(clientKey)

      await tossPayments.requestPayment("카드", {
        amount: amountCents / 100,
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success?paymentId=${paymentId}`,
        failUrl: `${window.location.origin}/payment/fail?paymentId=${paymentId}`,
      })
    } catch {
      setErrorMessage("구독 처리에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    try {
      setLoading(true)

      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ creatorId }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        alert(data.error ?? "Failed to cancel subscription")
        return
      }

      setCancelAtPeriodEnd(true)
    } catch {
      alert("Failed to cancel subscription")
    } finally {
      setLoading(false)
    }
  }

  const baseBtn =
    "w-full sm:w-auto px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"

  if (checking) {
    return (
      <button
        disabled
        className={`${baseBtn} rounded-md bg-zinc-200 text-zinc-700`}
      >
        Loading...
      </button>
    )
  }

  if (isOwner) {
    return (
      <button
        disabled
        className={`${baseBtn} rounded-md bg-zinc-200 text-zinc-700`}
      >
        Your creator page
      </button>
    )
  }

  if (subscribed) {
    return (
      <div className="flex w-full flex-col gap-2 sm:w-auto">
        <button
          disabled
          className={`${baseBtn} rounded-md bg-green-100 text-green-700`}
        >
          {cancelAtPeriodEnd ? "Cancellation scheduled" : "Subscribed"}
        </button>

        <button
          onClick={handleCancel}
          disabled={loading || cancelAtPeriodEnd}
          className={`${baseBtn} rounded-md border border-red-300 bg-white text-red-600 hover:bg-red-50`}
        >
          {cancelAtPeriodEnd ? "Scheduled" : "Cancel"}
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`${baseBtn} rounded-md bg-[#C2185B] text-white hover:bg-[#D81B60]`}
      >
        {loading ? "Loading..." : "Subscribe"}
      </button>

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600">{errorMessage}</p>
        </div>
      )}
    </div>
  )
}