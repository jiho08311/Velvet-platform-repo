"use client"

import { loadTossPayments } from "@tosspayments/payment-sdk"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { resolveSubscribeCTA } from "@/shared/ui/cta-state"
import { getCreatorSubscriptionPresentation } from "./creator-surface-policy"
import { SubscribeButtonView } from "./SubscribeButtonView"
import {
  getSubscribeErrorMessage,
  resolveSubscriptionFlags,
  type CheckoutResponse,
  type SubscriptionCheckResponse,
} from "./subscribe-button-model"

type SubscribeButtonProps = {
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  creatorUsername?: string
  embedded?: boolean
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

  return (
    <SubscribeButtonView
      cta={cta}
      checking={checking}
      isOwner={isOwner}
      subscribed={subscribed}
      cancelAtPeriodEnd={cancelAtPeriodEnd}
      embedded={embedded}
      errorMessage={errorMessage}
      cancelAtPeriodEndMessage={
        subscriptionPresentation.cancelAtPeriodEndMessage
      }
      onSubscribe={handleSubscribe}
      onCancel={handleCancel}
    />
  )
}
