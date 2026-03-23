import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post"
import { getActiveSubscription } from "@/modules/subscription/server/get-active-subscription"

type GetCreatorFeedInput = {
  creatorId: string
  userId?: string | null
}

export async function getCreatorFeed({
  creatorId,
  userId,
}: GetCreatorFeedInput) {
  const safeUserId =
    typeof userId === "string" && userId.trim().length > 0
      ? userId.trim()
      : null

  const subscription = safeUserId
    ? await getActiveSubscription({
        userId: safeUserId,
        creatorId,
      })
    : null

  const hasSubscriptionAccess = Boolean(subscription)

  const { data: posts, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  const resolvedPosts = await Promise.all(
    (posts ?? []).map(async (post) => {
      const isSubscribersOnly = post.visibility === "subscribers"
      const isPaidPost =
        post.visibility === "paid" &&
        typeof post.price_cents === "number" &&
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