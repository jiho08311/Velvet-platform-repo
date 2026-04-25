import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import {
  createCommentItem,
  type CommentRow,
  type CommentItemProfile,
} from "@/modules/post/lib/comment-item"
import {
  incrementLikeCountMap,
  readLikeCountFromMap,
} from "@/shared/lib/like-interaction-result"

type RouteContext = {
  params: Promise<{
    postId: string
  }>
}

type ProfileRow = {
  id: string
} & CommentItemProfile

type CommentLikeRow = {
  comment_id: string
  user_id: string
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  const { postId } = await context.params

  if (!postId) {
    return NextResponse.json({ error: "Post id is required" }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentUserId = user?.id ?? null

  const { data: comments, error: commentsError } = await supabaseAdmin
    .from("comments")
    .select("id, post_id, user_id, content, created_at")
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<CommentRow[]>()

  if (commentsError) {
    return NextResponse.json(
      { error: commentsError.message },
      { status: 500 }
    )
  }

  const commentIds = (comments ?? []).map((comment) => comment.id)

  const { data: likeRows, error: likeRowsError } = await supabaseAdmin
    .from("comment_likes")
    .select("comment_id, user_id")
    .in("comment_id", commentIds.length > 0 ? commentIds : ["00000000-0000-0000-0000-000000000000"])
    .returns<CommentLikeRow[]>()

  if (likeRowsError) {
    return NextResponse.json(
      { error: likeRowsError.message },
      { status: 500 }
    )
  }

  const likeCountMap = new Map<string, number>()

  for (const row of likeRows ?? []) {
    incrementLikeCountMap(likeCountMap, row.comment_id)
  }

  const likedCommentIdSet = new Set(
    currentUserId
      ? (likeRows ?? [])
          .filter((row) => row.user_id === currentUserId)
          .map((row) => row.comment_id)
      : []
  )

  const userIds = Array.from(
    new Set((comments ?? []).map((comment) => comment.user_id).filter(Boolean))
  )

  let profileMap = new Map<string, ProfileRow>()

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds)
      .returns<ProfileRow[]>()

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      )
    }

    profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  }

  const items = (comments ?? []).map((comment) => {
    const profile = profileMap.get(comment.user_id)

    return createCommentItem({
      comment,
      profile,
      likesCount: readLikeCountFromMap(likeCountMap, comment.id),
      isLiked: likedCommentIdSet.has(comment.id),
    })
  })

  return NextResponse.json({ items })
}
