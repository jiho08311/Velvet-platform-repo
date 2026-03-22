import { notFound } from "next/navigation"

import { getCreatorByUsername } from "@/modules/creator/server/get-creator-by-username"
import { CreatorHeader } from "@/modules/creator/ui/CreatorHeader"
import { getCreatorPosts } from "@/modules/post/server/get-creator-posts"
import { LockedPostCard } from "@/modules/post/ui/LockedPostCard"
import { PostCard } from "@/modules/post/ui/PostCard"
import { getProfileByUsername } from "@/modules/profile/server/get-profile-by-username"

type CreatorProfilePageProps = {
  params: {
    username: string
  }
}

export default async function CreatorProfilePage({
  params,
}: CreatorProfilePageProps) {
  const username = params.username

  const [creator, profile] = await Promise.all([
    getCreatorByUsername(username),
    getProfileByUsername(username),
  ])

  if (!creator || !profile) {
    notFound()
  }

  const { items: posts } = await getCreatorPosts({
    creatorId: creator.id,
    limit: 20,
  })

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <CreatorHeader
        avatarUrl={profile.avatarUrl}
        displayName={profile.displayName}
        username={profile.username}
        bio={profile.bio}
        headline={creator.headline}
        subscriptionPrice={creator.subscriptionPrice}
        isVerified={creator.isVerified}
      />

      <section className="grid gap-4">
        {posts.map((post) =>
          post.isLocked ? (
            <LockedPostCard
              key={post.id}
              previewText={post.caption}
              createdAt={post.publishedAt ?? ""}
              unlockLabel="Subscribe to unlock"
            />
          ) : (
            <PostCard
              key={post.id}
              text={post.caption}
              createdAt={post.publishedAt ?? ""}
            />
          )
        )}
      </section>
    </main>
  )
}