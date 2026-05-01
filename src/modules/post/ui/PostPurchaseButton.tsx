"use client"

import { useState } from "react"
import { loadTossPayments } from "@tosspayments/tosspayments-sdk"
import { Button } from "@/shared/ui/Button"
import { resolvePurchaseCTA } from "@/shared/ui/cta-state"

const PURCHASE_ERROR_MESSAGE = "콘텐츠 이용 처리에 실패했습니다"
const INVALID_PRICE_ERROR_MESSAGE = "콘텐츠 가격이 올바르지 않습니다"

const purchaseErrorMessages: Record<string, string> = {
  POST_ALREADY_PURCHASED: "이미 이용한 콘텐츠입니다",
  "Post not found": "콘텐츠를 찾을 수 없습니다",
  "Invalid price": INVALID_PRICE_ERROR_MESSAGE,
  CANNOT_PURCHASE_OWN_POST: "내 콘텐츠는 구매할 수 없습니다",
  SUBSCRIBED_USER_ALREADY_HAS_ACCESS:
    "이미 구독으로 이용 가능한 콘텐츠입니다",
}

type Props = {
  postId: string
  price?: number
  creatorUsername?: string
  embedded?: boolean
}

function getPurchaseErrorMessage(error: unknown) {
  if (typeof error !== "string") {
    return PURCHASE_ERROR_MESSAGE
  }

  return purchaseErrorMessages[error] ?? PURCHASE_ERROR_MESSAGE
}

function getContainerClassName(embedded: boolean) {
  return embedded ? "mt-0" : "flex flex-col gap-2"
}

function renderPurchaseHelperText(embedded: boolean) {
  return !embedded ? (
    <p className="text-center text-xs text-zinc-500">
      프리미엄 콘텐츠 이용
    </p>
  ) : null
}

function renderPurchaseError(error: string) {
  return error ? (
    <p className="mt-2 text-center text-xs text-red-400">{error}</p>
  ) : null
}

export default function PostPurchaseButton({
  postId,
  price,
  creatorUsername,
  embedded = false,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handlePurchase() {
    try {
      setLoading(true)
      setError("")

      if (typeof price !== "number" || price <= 0) {
        setError(INVALID_PRICE_ERROR_MESSAGE)
        return
      }

      const res = await fetch("/api/post/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(getPurchaseErrorMessage(data.error))
        return
      }

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey) {
        setError("결제 설정 오류")
        return
      }

      const payment = data.payment

      if (!payment?.id || !payment?.amount) {
        setError("결제 정보가 올바르지 않습니다")
        return
      }

      const tossPayments = (await loadTossPayments(clientKey)) as any

      const paymentInstance = tossPayments.payment({
        customerKey: payment.id,
      })

      await paymentInstance.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: payment.amount,
        },
        orderId: data.orderId ?? payment.id,
        orderName: data.orderName ?? "프리미엄 콘텐츠 이용권",
        successUrl: `${window.location.origin}/payment/success?paymentId=${payment.id}&postId=${postId}&creatorUsername=${creatorUsername ?? ""}`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (error) {
      console.error("post purchase error:", error)
      setError(PURCHASE_ERROR_MESSAGE)
    } finally {
      setLoading(false)
    }
  }

  const cta = resolvePurchaseCTA({
    loading,
  })

  return (
    <div className={getContainerClassName(embedded)}>
      <Button
        type="button"
        onClick={handlePurchase}
        variant={cta.primary.variant}
        disabled={cta.primary.disabled}
        loading={cta.primary.loading}
        loadingLabel={cta.primary.loadingLabel}
        embedded={embedded}
        fullWidth={!embedded}
      >
        {cta.primary.label}
      </Button>

      {renderPurchaseHelperText(embedded)}
      {renderPurchaseError(error)}
    </div>
  )
}
