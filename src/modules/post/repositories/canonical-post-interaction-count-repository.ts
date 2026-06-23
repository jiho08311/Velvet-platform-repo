import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function refreshCanonicalPostInteractionCounts(
  postId: string
): Promise<void> {
  const [{ count: likesCount, error: likesError }, { count: commentsCount, error: commentsError }] =
    await Promise.all([
      supabaseAdmin
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId),

      supabaseAdmin
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId)
        .is("deleted_at", null),
    ])

  if (likesError) {
    throw likesError
  }

  if (commentsError) {
    throw commentsError
  }

  const { error } = await supabaseAdmin
    .from("canonical_post_interaction_counts")
    .upsert(
      {
        post_id: postId,
        likes_count: likesCount ?? 0,
        comments_count: commentsCount ?? 0,
        bookmarks_count: 0,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "post_id",
      }
    )

  if (error) {
    throw error
  }
}