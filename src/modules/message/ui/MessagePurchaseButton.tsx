"use client"

import { useState } from "react"

type MessagePurchaseButtonProps = {
  messageId: string
}

function getMessagePurchaseErrorMessage(message: string) {
  if (message === "MESSAGE_ALREADY_PURCHASED") {
    return "이미 구매한 메시지입니다"
  }

  if (message === "Invalid message price") {
    return "메시지 가격이 올바르지 않습니다"
  }

  if (message === "Message not found") {
    return "메시지를 찾을 수 없습니다"
  }

  return "메시지 구매에 실패했습니다"
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

      const paymentId = checkoutData.payment?.id

      if (!paymentId) {
        throw new Error("Missing paymentId")
      }

      const confirmRes = await fetch("/api/payment/confirm-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          messageId,
        }),
      })

      const confirmData = await confirmRes.json()

      if (!confirmRes.ok) {
        throw new Error(confirmData.error ?? "Failed to confirm payment")
      }

      window.location.reload()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to purchase message"

      setErrorMessage(getMessagePurchaseErrorMessage(message))
    } finally {
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
        {isLoading ? "Processing..." : "Unlock message"}
      </button>

      {errorMessage ? (
        <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
          <p className="text-xs text-red-300">{errorMessage}</p>
        </div>
      ) : null}
    </div>
  )
}