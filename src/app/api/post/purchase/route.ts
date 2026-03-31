import { NextResponse } from "next/server"
import { createPaymentCheckout } from "@/modules/payment/server/create-payment-checkout"
import { getPostById } from "@/modules/post/server/get-post-by-id"
import { getCreatorById } from "@/modules/creator/server/get-creator-by-id"
import { createClient } from "@/infrastructure/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  if (post.priceCents === null) {
    return NextResponse.json(
      { error: "This post is not a PPV post" },
      { status: 400 }
    )
  }

  const creator = await getCreatorById(post.creatorId)

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 })
  }

  if (creator.userId === user.id) {
    return NextResponse.json(
      { error: "Creators cannot purchase their own posts" },
      { status: 400 }
    )
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_APP_URL" },
      { status: 500 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const result = await createPaymentCheckout({
    userId: user.id,
    creatorId: post.creatorId,
    type: "ppv_post",
    amountCents: post.priceCents,
    currency: "KRW",
    provider: "toss",
    targetType: "post",
    targetId: post.id,
    orderId: `ppv_${post.id}_${user.id}_${Date.now()}`,
    orderName: post.title || "Paid Post",
    successUrl: `${appUrl}/payment/success?postId=${post.id}&creatorUsername=${creator.username}`,
    failUrl: `${appUrl}/payment/fail`,
  })

  return NextResponse.json(result)
}