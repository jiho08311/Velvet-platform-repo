"use client"

import { useState } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import type { PostBlockEditorState } from "@/modules/post/types"
import { PostCard } from "@/modules/post/ui/PostCard"

type CreatorTextPost = {
  id: string
  content: string
  created_at: string
  media: Array<{
    id?: string
    url: string
    type?: "image" | "video" | "audio" | "file"
  }>
  blocks: Array<{
    id: string
    postId: string
    type: "text" | "image" | "video" | "audio" | "file"
    content: string | null
    mediaId: string | null
    sortOrder: number
    createdAt: string
    editorState?: PostBlockEditorState | null
  }>
  isLocked?: boolean
  commentsCount?: number
  likesCount?: number
  isLiked?: boolean
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

type CreatorTextPostSectionProps = {
  posts: CreatorTextPost[]
  title?: string
}

export function CreatorTextPostSection({
  posts,
  title = "Text posts",
}: CreatorTextPostSectionProps) {
  const [selectedPost, setSelectedPost] = useState<CreatorTextPost | null>(null)

  if (posts.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-400">{title}</p>

        <div className="space-y-3">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelectedPost(post)}
              className="block w-full cursor-pointer rounded-2xl bg-zinc-900 p-4 text-left transition hover:bg-zinc-800"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  {post.creator.displayName ?? post.creator.username}
                </p>

                <p className="text-xs text-zinc-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>

              <p className="mt-2 line-clamp-4 text-sm text-zinc-300">
                {post.content}
              </p>

              <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                <span>❤️ {post.likesCount ?? 0}</span>
                <span>💬 {post.commentsCount ?? 0}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedPost ? (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSelectedPost(null)}
            className="absolute inset-0"
          />

          <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-8">
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div
              className="relative z-10 w-full rounded-3xl bg-black"
              onClick={(event) => event.stopPropagation()}
            >
              <PostCard
                postId={selectedPost.id}
                text={selectedPost.content ?? ""}
                createdAt={new Date(selectedPost.created_at).toLocaleString()}
                media={selectedPost.media ?? []}
                blocks={selectedPost.blocks ?? []}
                isLocked={selectedPost.isLocked ?? false}
                commentsCount={selectedPost.commentsCount ?? 0}
                likesCount={selectedPost.likesCount ?? 0}
                isLiked={selectedPost.isLiked ?? false}
                creatorId={selectedPost.creatorId}
                creatorUserId={selectedPost.creatorUserId}
                currentUserId={selectedPost.currentUserId}
                creator={selectedPost.creator}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}