"use client"

import { useState } from "react"
import { loadTossPayments } from "@tosspayments/tosspayments-sdk"

type MessagePurchaseButtonProps = {
  messageId: string
}

function getMessagePurchaseErrorMessage(message: string) {
  if (message === "MESSAGE_ALREADY_PURCHASED") {
    return "이미 이용한 콘텐츠입니다"
  }

  if (message === "Invalid message price") {
    return "콘텐츠 가격이 올바르지 않습니다"
  }

  if (message === "Message not found") {
    return "콘텐츠를 찾을 수 없습니다"
  }

  return "콘텐츠 이용 처리에 실패했습니다"
}

export function MessagePurchaseButton({
  messageId,
}: MessagePurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handlePurchase() {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const checkoutRes = await fetch("/api/message/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId }),
      })

      const checkoutData = await checkoutRes.json()

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error ?? "Failed to create payment")
      }

      const payment = checkoutData.payment

      if (!payment) {
        throw new Error("Missing payment data")
      }

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY

      if (!clientKey) {
        throw new Error("Missing NEXT_PUBLIC_TOSS_CLIENT_KEY")
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
        orderId: payment.id,
        orderName: "프리미엄 콘텐츠 이용권", // 🔥 핵심 변경
        successUrl: `${window.location.origin}/payment/success?messageId=${messageId}`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to purchase message"

      setErrorMessage(getMessagePurchaseErrorMessage(message))
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handlePurchase}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-xl bg-[#C2185B] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "처리 중..." : "이용권 구매"} {/* 🔥 핵심 변경 */}
      </button>

      {errorMessage ? (
        <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
          <p className="text-xs text-red-300">{errorMessage}</p>
        </div>
      ) : null}
    </div>
  )
}