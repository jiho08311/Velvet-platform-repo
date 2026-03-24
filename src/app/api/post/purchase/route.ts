import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createPaymentCheckout } from "@/modules/payment/server/create-payment-checkout"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"

type PurchaseRequestBody = {
  postId?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PurchaseRequestBody
    const postId = body.postId

    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 })
    }

    const user = await requireUser()

    const { data: post, error: postError } = await supabaseAdmin
      .from("posts")
      .select("id, creator_id, price_cents")
      .eq("id", postId)
      .maybeSingle()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (!post.price_cents || post.price_cents <= 0) {
      return NextResponse.json(
        { error: "Invalid post price" },
        { status: 400 }
      )
    }

    const alreadyPurchased = await hasPurchasedPost({
      userId: user.id,
      postId: post.id,
    })

    if (alreadyPurchased) {
      return NextResponse.json(
        { error: "POST_ALREADY_PURCHASED" },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL" },
        { status: 500 }
      )
    }

    const result = await createPaymentCheckout({
      userId: user.id,
      creatorId: post.creator_id,
      type: "ppv_post",
      amountCents: post.price_cents,
      provider: "mock",
      targetType: "post",
      targetId: post.id,
      orderId: `ppv_${post.id}_${user.id}_${Date.now()}`,
      orderName: "Post purchase",
      successUrl: `${appUrl}/payment/success`,
      failUrl: `${appUrl}/payment/fail`,
    })

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create post purchase request"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}