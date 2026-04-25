"use client"

import { loadTossPayments } from "@tosspayments/payment-sdk"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/shared/ui/Button"
import { resolveSubscribeCTA } from "@/shared/ui/cta-state"
import { getCreatorSubscriptionPresentation } from "./creator-surface-policy"

type SubscribeButtonProps = {
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  creatorUsername?: string
  embedded?: boolean
}

type SubscriptionCheckState = "active" | "ending" | "expired" | "inactive"

type SubscriptionCheckResponse = {
  subscribed?: boolean
  cancelAtPeriodEnd?: boolean
  hasAccess?: boolean
  state?: SubscriptionCheckState
  isCancelScheduled?: boolean
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

function resolveSubscriptionFlags(data: SubscriptionCheckResponse) {
  const state = data.state

  if (state) {
    return {
      subscribed: data.hasAccess ?? (state === "active" || state === "ending"),
      cancelAtPeriodEnd:
        data.isCancelScheduled ?? (state === "ending"),
    }
  }

  return {
    subscribed: Boolean(data.subscribed),
    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
  }
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
  const subscriptionPresentation = getCreatorSubscriptionPresentation(
    creatorUsername ?? "this creator"
  )
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
      const flags = resolveSubscriptionFlags(data)

      setSubscribed(flags.subscribed)
      setCancelAtPeriodEnd(flags.cancelAtPeriodEnd)

      return flags.subscribed
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
        amount,
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success?paymentId=${paymentId}&creatorUsername=${creatorUsername}`,
        failUrl: `${window.location.origin}/payment/fail?paymentId=${paymentId}`,
      })

      setSubscribed(true)
      setCancelAtPeriodEnd(false)
      router.refresh()
    } catch {
      setErrorMessage(subscriptionPresentation.subscribeFallbackError)
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
        setErrorMessage(
          data.error ?? subscriptionPresentation.cancelFallbackError
        )
        return
      }

      setCancelAtPeriodEnd(true)
      setSubscribed(true)
      router.refresh()
    } catch {
      setErrorMessage(subscriptionPresentation.cancelFallbackError)
    } finally {
      setLoading(false)
    }
  }

  const cta = resolveSubscribeCTA({
    checking,
    isOwner,
    subscribed,
    cancelAtPeriodEnd,
    loading,
  })

  if (checking || isOwner) {
    return (
      <Button
        variant={cta.primary.variant}
        disabled={cta.primary.disabled}
        loading={cta.primary.loading}
        loadingLabel={cta.primary.loadingLabel}
        embedded
        className={
          isOwner
            ? "bg-zinc-800 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
            : undefined
        }
      >
        {cta.primary.label}
      </Button>
    )
  }

  if (subscribed) {
    return (
      <div className="flex w-full flex-col gap-2">
        <Button
          variant={cta.primary.variant}
          disabled={cta.primary.disabled}
          fullWidth
          className="border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-950"
        >
          {cta.primary.label}
        </Button>

        {cta.secondary ? (
          <Button
            type="button"
            onClick={handleCancel}
            variant={cta.secondary.variant}
            loading={cta.secondary.loading}
            loadingLabel={cta.secondary.loadingLabel}
          >
            {cta.secondary.label}
          </Button>
        ) : null}

        {cancelAtPeriodEnd ? (
          <p className="text-center text-xs text-zinc-500">
            {subscriptionPresentation.cancelAtPeriodEndMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="text-center text-xs text-red-400">{errorMessage}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="w-full">
      <Button
        onClick={handleSubscribe}
        loading={cta.primary.loading}
        loadingLabel={cta.primary.loadingLabel}
        embedded={embedded}
        fullWidth={!embedded}
      >
        {cta.primary.label}
      </Button>

      {errorMessage ? (
        <p className="mt-2 text-center text-xs text-red-400">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}