import Link from "next/link"

import { PostPurchaseButton } from "./PostPurchaseButton"

type PostCardProps = {
  postId?: string
  text: string
  createdAt: string
  mediaThumbnailUrls?: string[]
  isLocked?: boolean
}

export function PostCard({
  postId,
  text,
  createdAt,
  mediaThumbnailUrls,
  isLocked = false,
}: PostCardProps) {
  const thumbnails = mediaThumbnailUrls ?? []

  function renderMedia() {
    if (thumbnails.length === 0) {
      return (
        <div className="flex aspect-[16/9] items-center justify-center border-b border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
          No media
        </div>
      )
    }

    if (thumbnails.length === 1) {
      return (
        <div className="overflow-hidden border-b border-zinc-200 bg-zinc-100">
          <div className="aspect-[4/5] w-full overflow-hidden">
            <img
              src={thumbnails[0]}
              alt="Post media"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )
    }

    if (thumbnails.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-px border-b border-zinc-200 bg-zinc-200">
          {thumbnails.slice(0, 2).map((thumbnailUrl, index) => (
            <div
              key={`${thumbnailUrl}-${index}`}
              className="aspect-square overflow-hidden bg-zinc-100"
            >
              <img
                src={thumbnailUrl}
                alt={`Post media ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-3 gap-px border-b border-zinc-200 bg-zinc-200">
        {thumbnails.slice(0, 3).map((thumbnailUrl, index) => (
          <div
            key={`${thumbnailUrl}-${index}`}
            className="aspect-square overflow-hidden bg-zinc-100"
          >
            <img
              src={thumbnailUrl}
              alt={`Post media ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    )
  }

  const content = (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-colors duration-200 hover:border-[#C2185B]/40">
      {renderMedia()}

      <div className="p-4">
        {isLocked ? (
          <div className="rounded-2xl border border-[#C2185B]/20 bg-[#FFF1F5] p-4">
            <p className="text-sm font-medium text-zinc-900">
              This post is locked.
            </p>
            <p className="mt-2 text-xs text-zinc-600">
              Purchase access to view this content.
            </p>
            {postId ? <PostPurchaseButton postId={postId} /> : null}
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">
            {text}
          </p>
        )}

        <p className="mt-4 text-xs text-zinc-500">{createdAt}</p>
      </div>
    </article>
  )

  if (!postId) {
    return content
  }

  return (
    <Link href={`/post/${postId}`} className="block">
      {content}
    </Link>
  )
}