"use client"

import { useState } from "react"

type PostPurchaseButtonProps = {
  postId: string
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

export function PostPurchaseButton({ postId }: PostPurchaseButtonProps) {
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

      const paymentId = checkoutData.payment?.id

      if (!paymentId) {
        throw new Error("Missing paymentId")
      }

      const confirmRes = await fetch("/api/payment/mock/confirm-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          postId,
        }),
      })

      const confirmData = await confirmRes.json()

      if (!confirmRes.ok) {
        throw new Error(confirmData.error ?? "Failed to confirm payment")
      }

      window.location.reload()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to purchase post"

      setErrorMessage(getPostPurchaseErrorMessage(message))
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
        className="inline-flex items-center justify-center rounded-md bg-[#C2185B] px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Processing..." : "Unlock post"}
      </button>

      {errorMessage ? (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600">{errorMessage}</p>
        </div>
      ) : null}
    </div>
  )
}