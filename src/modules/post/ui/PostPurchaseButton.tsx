"use client"

import { useState } from "react"
import { loadTossPayments } from "@tosspayments/tosspayments-sdk"
import { Button } from "@/shared/ui/Button"
import { resolvePurchaseCTA } from "@/shared/ui/cta-state"

type Props = {
  postId: string
  price?: number
  creatorUsername?: string
  embedded?: boolean
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
        setError("콘텐츠 가격이 올바르지 않습니다")
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
        if (data.error === "POST_ALREADY_PURCHASED") {
          setError("이미 이용한 콘텐츠입니다")
        } else if (data.error === "Post not found") {
          setError("콘텐츠를 찾을 수 없습니다")
        } else if (data.error === "Invalid price") {
          setError("콘텐츠 가격이 올바르지 않습니다")
        } else if (data.error === "CANNOT_PURCHASE_OWN_POST") {
          setError("내 콘텐츠는 구매할 수 없습니다")
        } else if (data.error === "SUBSCRIBED_USER_ALREADY_HAS_ACCESS") {
          setError("이미 구독으로 이용 가능한 콘텐츠입니다")
        } else {
          setError("콘텐츠 이용 처리에 실패했습니다")
        }
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
      setError("콘텐츠 이용 처리에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  // ✅ CTA 상태 중앙화 (최소 추가)
  const cta = resolvePurchaseCTA({
    loading,
  })

  return (
    <div className={embedded ? "mt-0" : "flex flex-col gap-2"}>
      <Button
        type="button"
        onClick={handlePurchase}
        loading={cta.primary.loading}
        loadingLabel={cta.primary.loadingLabel}
        embedded={embedded}
        fullWidth={!embedded}
      >
        {cta.primary.label}
      </Button>

      {!embedded ? (
        <p className="text-center text-xs text-zinc-500">
          프리미엄 콘텐츠 이용
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-center text-xs text-red-400">{error}</p>
      ) : null}
    </div>
  )
}
