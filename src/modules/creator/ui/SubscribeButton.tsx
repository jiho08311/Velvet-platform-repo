"use client"

import { loadTossPayments } from "@tosspayments/payment-sdk"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

type SubscribeButtonProps = {
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  creatorUsername?: string
  embedded?: boolean
}

type SubscriptionCheckResponse = {
  subscribed?: boolean
  cancelAtPeriodEnd?: boolean
}

type CheckoutResponse = {
  payment?: {
    id?: string
    amount?: number
  }
  checkout?: {
    orderId?: string
    orderName?: string
  }
  error?: string
}

function getSubscribeErrorMessage(message: string) {
  if (message === "You already have an active subscription") {
    return "이미 구독 중입니다"
  }

  if (message === "You cannot subscribe to your own creator page") {
    return "본인 페이지는 구독할 수 없습니다"
  }

  if (message === "Invalid subscription price") {
    return "구독 가격이 올바르지 않습니다"
  }

  if (message === "Creator not found") {
    return "페이지를 찾을 수 없습니다"
  }

  return "구독 처리에 실패했습니다"
}

export default function SubscribeButton({
  creatorId,
  creatorUserId,
  currentUserId,
  creatorUsername,
  embedded = false,
}: SubscribeButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)
  const [checking, setChecking] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const nextPath = useMemo(
    () =>
      encodeURIComponent(
        pathname || (creatorUsername ? `/creator/${creatorUsername}` : "/feed")
      ),
    [pathname, creatorUsername]
  )

  const isGuest = !currentUserId

  const isOwner =
    Boolean(currentUserId) &&
    Boolean(creatorUserId) &&
    currentUserId === creatorUserId

  async function checkCreatorSubscription() {
    if (isGuest) {
      setSubscribed(false)
      setCancelAtPeriodEnd(false)
      setChecking(false)
      return false
    }

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
  }, [creatorId, isOwner, isGuest])

  // ✅ 페이지 돌아올 때 상태 다시 확인 (핵심)
  useEffect(() => {
    checkCreatorSubscription()
  }, [pathname])

  async function handleSubscribe() {
    if (isGuest) {
      router.push(`/sign-in?next=${nextPath}`)
      return
    }

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
      const amount = data.payment?.amount ?? 0
      const orderId = data.checkout?.orderId ?? paymentId
      const orderName = data.checkout?.orderName ?? "크리에이터 멤버십"

      if (!paymentId || !orderId || amount <= 0) {
        setErrorMessage("결제 요청 정보가 올바르지 않습니다")
        return
      }

      const tossPayments = await loadTossPayments(clientKey)

      await tossPayments.requestPayment("카드", {
        amount: amount,
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success?paymentId=${paymentId}&creatorUsername=${creatorUsername}`,
        failUrl: `${window.location.origin}/payment/fail?paymentId=${paymentId}`,
      })

      // ✅ 즉시 상태 반영 (핵심)
      setSubscribed(true)
      setCancelAtPeriodEnd(false)
      router.refresh()
    } catch {
      setErrorMessage("구독 처리에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    try {
      setLoading(true)
      setErrorMessage("")

      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ creatorId }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMessage(data.error ?? "구독 종료에 실패했습니다")
        return
      }

      setCancelAtPeriodEnd(true)

      // ✅ 즉시 반영
      setSubscribed(true)
      router.refresh()
    } catch {
      setErrorMessage("구독 종료에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const buttonBase = embedded
    ? "inline-flex h-12 min-w-[220px] items-center justify-center rounded-full bg-[#C2185B] px-6 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457] disabled:cursor-not-allowed disabled:opacity-60"
    : "inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"

  if (checking) {
    return (
      <button disabled className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-full bg-zinc-800 px-6 text-sm font-semibold text-zinc-300">
        확인 중...
      </button>
    )
  }

  if (isOwner) {
    return (
      <button disabled className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-full bg-zinc-800 px-6 text-sm font-semibold text-zinc-400">
        내 페이지
      </button>
    )
  }

  if (subscribed) {
    return (
      <button
        onClick={handleCancel}
        disabled={loading || cancelAtPeriodEnd}
        className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 px-6 text-sm font-semibold text-zinc-100"
      >
        {cancelAtPeriodEnd
          ? "구독 종료 예정"
          : loading
            ? "처리 중..."
            : "구독 중"}
      </button>
    )
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className={`${buttonBase} w-full bg-[#C2185B] text-white`}
    >
      {loading ? "처리 중..." : "구독하기"}
    </button>
  )
}