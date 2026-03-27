"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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

export function PostPurchaseButton({
  postId,
}: PostPurchaseButtonProps) {
  const router = useRouter()
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

      const confirmRes = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
        }),
      })

      const confirmData = await confirmRes.json()

      if (!confirmRes.ok) {
        throw new Error(confirmData.error ?? "Failed to confirm payment")
      }

      router.replace(`/post/${postId}`)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to purchase post"

      setErrorMessage(getPostPurchaseErrorMessage(message))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full min-w-[220px] flex-col gap-2 sm:w-auto">
      <button
        type="button"
        onClick={handlePurchase}
        disabled={isLoading}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#C2185B] px-5 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Unlocking..." : "Unlock now"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        One-time purchase
      </p>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-xs leading-5 text-red-300">{errorMessage}</p>
        </div>
      ) : null}
    </div>
  )
}