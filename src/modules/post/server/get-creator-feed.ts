import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"

type GetCreatorFeedInput = {
  creatorId: string
  userId?: string | null
}

type PostRow = {
  id: string
  creator_id: string
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price_cents: number
  status: string
  created_at: string
}

export async function getCreatorFeed({
  creatorId,
  userId,
}: GetCreatorFeedInput) {
  const safeUserId =
    typeof userId === "string" && userId.trim().length > 0
      ? userId.trim()
      : null

  const hasSubscriptionAccess =
    safeUserId
      ? await checkSubscription({
          userId: safeUserId,
          creatorId,
        })
      : false

  const { data: posts, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .returns<PostRow[]>()

  if (error) {
    throw error
  }

  const resolvedPosts = await Promise.all(
    (posts ?? []).map(async (post) => {
      const isSubscribersOnly = post.visibility === "subscribers"
      const isPaidPost =
        post.visibility === "paid" &&
        post.price_cents > 0

      let hasPurchased = false

      if (safeUserId && isPaidPost) {
        hasPurchased = await hasPurchasedPost({
          userId: safeUserId,
          postId: post.id,
        })
      }

      const isLocked =
        (isSubscribersOnly && !hasSubscriptionAccess) ||
        (isPaidPost && !hasPurchased)

      return {
        ...post,
        isLocked,
        content: isLocked ? null : post.content,
      }
    })
  )

  return resolvedPosts
}