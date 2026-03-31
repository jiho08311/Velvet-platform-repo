"use client"

import { useState } from "react"
import { loadTossPayments } from "@tosspayments/tosspayments-sdk"

type PostPurchaseButtonProps = {
  postId: string
  embedded?: boolean
}

function getPostPurchaseErrorMessage(message: string) {
  if (message === "POST_ALREADY_PURCHASED") {
    return "이미 구매한 콘텐츠입니다"
  }

  if (message === "Invalid post price") {
    return "게시물 가격이 올바르지 않습니다"
  }

  if (message === "Post not found") {
    return "게시물을 찾을 수 없습니다"
  }

  return "게시물 구매에 실패했습니다"
}

export function PostPurchaseButton({
  postId,
  embedded = false,
}: PostPurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handlePurchase() {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const checkoutRes = await fetch("/api/post/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
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
          value: payment.amountCents,
        },
        orderId: payment.id,
        orderName: "Paid post",
        successUrl: `${window.location.origin}/payment/success?postId=${postId}&creatorId=${payment.creatorId}&orderId=${payment.id}`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to purchase post"

      setErrorMessage(getPostPurchaseErrorMessage(message))
      setIsLoading(false)
    }
  }

  return (
    <div className={embedded ? "flex flex-col items-center gap-2" : "flex w-full min-w-[220px] flex-col gap-2 sm:w-auto"}>
      <button
        type="button"
        onClick={handlePurchase}
        disabled={isLoading}
        className={
          embedded
            ? "inline-flex h-12 min-w-[220px] items-center justify-center rounded-full bg-[#C2185B] px-6 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457] disabled:cursor-not-allowed disabled:opacity-60"
            : "inline-flex h-12 w-full items-center justify-center rounded-full bg-[#C2185B] px-5 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457] disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isLoading ? "Unlocking..." : "Unlock now"}
      </button>

      {!embedded ? (
        <p className="text-center text-xs text-zinc-500">
          One-time purchase
        </p>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-xs leading-5 text-red-300">{errorMessage}</p>
        </div>
      ) : null}
    </div>
  )
}