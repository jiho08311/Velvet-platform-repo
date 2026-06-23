import { NextResponse } from "next/server"
import { createCheckout } from "@/modules/commerce/public/payment-contract"
import { getPostById } from "@/modules/post/public/get-post"
import { getCreatorById } from "@/modules/creator/public/get-creator-by-id"

import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import type { PostPurchaseBlockingReason } from "@/modules/post/types"

function getPurchaseBlockingError(
  blockingReason: PostPurchaseBlockingReason
): { error: string; status: number } {
  switch (blockingReason) {
    case "already_purchased":
      return {
        error: "POST_ALREADY_PURCHASED",
        status: 400,
      }
    case "invalid_price":
      return {
        error: "Invalid price",
        status: 400,
      }
    case "owner":
      return {
        error: "CANNOT_PURCHASE_OWN_POST",
        status: 400,
      }
    case "subscribed":
      return {
        error: "SUBSCRIBED_USER_ALREADY_HAS_ACCESS",
        status: 400,
      }
    case "not_paid_post":
      return {
        error: "This post is not a PPV post",
        status: 400,
      }
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const postId = typeof body.postId === "string" ? body.postId : ""

  if (!postId) {
    return NextResponse.json({ error: "Post id is required" }, { status: 400 })
  }

  const post = await getPostById(postId, user.id)

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const purchaseEligibility = post.commerce.purchaseEligibility

  if (!purchaseEligibility.canPurchase) {
    const purchaseBlockingError = getPurchaseBlockingError(
      purchaseEligibility.blockingReason
    )

    return NextResponse.json(
      { error: purchaseBlockingError.error },
      { status: purchaseBlockingError.status }
    )
  }

  if (post.price === null) {
    return NextResponse.json(
      { error: "This post is not a PPV post" },
      { status: 400 }
    )
  }

  const creator = await getCreatorById(post.creatorId)

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 })
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_APP_URL" },
      { status: 500 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  try {
  const result = await createCheckout({
  payerUserId: user.id,
  creatorId: post.creatorId,
  purpose: "ppv_post",
  money: {
    amount: post.price,
    currency: "KRW",
  },
  provider: "toss",
  target: {
    type: "post",
    id: post.id,
  },
  orderId: `ppv_${post.id}_${user.id}_${Date.now()}`,
  orderName: post.title || "Paid Post",
  successUrl: `${appUrl}/payment/success?postId=${post.id}&creatorUsername=${creator.username}`,
  failUrl: `${appUrl}/payment/fail`,
})

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === "POST_ALREADY_PURCHASED") {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    throw error
  }
}
