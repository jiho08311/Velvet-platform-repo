import { createClient } from "@/infrastructure/supabase/server"

export async function listLikedPosts(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("post_likes")
    .select(
      `
        created_at,
        post:posts (
          id,
          content,
          creator_id,
          creators (
            user_id,
            profiles (
              username,
              display_name
            )
          ),
          media (
            thumbnail_url
          )
        )
      `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Failed to load liked posts")
  }

  return (data ?? []).map((item) => {
    const post = Array.isArray(item.post) ? item.post[0] : item.post
    const creator = Array.isArray(post?.creators) ? post.creators[0] : post?.creators
    const profile = Array.isArray(creator?.profiles)
      ? creator.profiles[0]
      : creator?.profiles
    const mediaItem = Array.isArray(post?.media) ? post.media[0] : post?.media

    return {
      id: post?.id ?? "",
      contentPreview: post?.content ?? "",
      createdAt: item.created_at,
      creatorUsername: profile?.username ?? "",
      creatorDisplayName: profile?.display_name ?? "",
      mediaThumbnailUrl: mediaItem?.thumbnail_url ?? null,
    }
  })
}