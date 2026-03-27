import { NextResponse } from "next/server";
import { createPpvPostPayment } from "@/modules/payment/server/create-ppv-post-payment";
import { getPostById } from "@/modules/post/server/get-post-by-id";
import { getCreatorById } from "@/modules/creator/server/get-creator-by-id";
import { createClient } from "@/infrastructure/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const postId = typeof body.postId === "string" ? body.postId : "";

  if (!postId) {
    return NextResponse.json({ error: "Post id is required" }, { status: 400 });
  }

  const post = await getPostById(postId, user.id);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.priceCents === null) {
    return NextResponse.json(
      { error: "This post is not a PPV post" },
      { status: 400 }
    );
  }

  const creator = await getCreatorById(post.creatorId);

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  if (creator.userId === user.id) {
    return NextResponse.json(
      { error: "Creators cannot purchase their own posts" },
      { status: 400 }
    );
  }

  await createPpvPostPayment({
    userId: user.id,
    creatorId: post.creatorId,
    postId: post.id,
    amount: post.priceCents,
    currency: "KRW",
  });

  return NextResponse.json({ ok: true });
}