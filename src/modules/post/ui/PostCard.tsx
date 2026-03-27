"use client"

import { useRouter } from "next/navigation"

import SubscribeButton from "@/modules/creator/ui/SubscribeButton"

import { LockedPostCard } from "./LockedPostCard"
import { PostPurchaseButton } from "./PostPurchaseButton"

type PostCardProps = {
  postId?: string
  text: string
  createdAt: string
  mediaThumbnailUrls?: string[]
  isLocked?: boolean
  lockReason?: "none" | "subscription" | "purchase"
  priceCents?: number
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

export function PostCard({
  postId,
  text,
  createdAt,
  mediaThumbnailUrls,
  isLocked = false,
  lockReason = "none",
  priceCents,
  creatorId,
  creatorUserId,
  currentUserId,
  creator,
}: PostCardProps) {
  const router = useRouter()

  const thumbnails = mediaThumbnailUrls ?? []
  const creatorName = creator.displayName ?? creator.username
  const creatorInitial = creatorName.slice(0, 1).toUpperCase()

  function handleCardClick() {
    if (!postId || isLocked) return
    router.push(`/post/${postId}`)
  }

  function renderMedia() {
    if (thumbnails.length === 0) {
      return null
    }

    if (thumbnails.length === 1) {
      return (
        <div className="overflow-hidden rounded-[28px] bg-zinc-950">
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
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] bg-zinc-950">
          {thumbnails.slice(0, 2).map((thumbnailUrl, index) => (
            <div
              key={`${thumbnailUrl}-${index}`}
              className="aspect-square overflow-hidden bg-zinc-900"
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
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[28px] bg-zinc-950">
        {thumbnails.slice(0, 3).map((thumbnailUrl, index) => (
          <div
            key={`${thumbnailUrl}-${index}`}
            className="aspect-square overflow-hidden bg-zinc-900"
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

  function renderLockedAction() {
    if (lockReason === "subscription") {
      return (
        <div onClick={(event) => event.stopPropagation()}>
          <SubscribeButton
            creatorId={creatorId}
            creatorUserId={creatorUserId}
            currentUserId={currentUserId}
          />
        </div>
      )
    }

    if (lockReason === "purchase" && postId) {
      return (
        <div onClick={(event) => event.stopPropagation()}>
          <PostPurchaseButton postId={postId} />
        </div>
      )
    }

    return null
  }

  return (
    <article
      onClick={handleCardClick}
      className={`overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-900/70 p-4 transition sm:p-5 ${
        isLocked
          ? "cursor-default"
          : "cursor-pointer hover:border-zinc-700"
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creatorName}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
              {creatorInitial}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {creatorName}
            </p>
            <p className="truncate text-xs text-zinc-400">
              @{creator.username}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {isLocked ? (
            <>
              <LockedPostCard
                previewText={text}
                createdAt={createdAt}
                previewThumbnailUrl={thumbnails[0] ?? null}
                ctaLabel={
                  lockReason === "subscription" ? "Subscribe now" : "Unlock post"
                }
                priceCents={priceCents}
                lockReason={
                  lockReason === "subscription" || lockReason === "purchase"
                    ? lockReason
                    : undefined
                }
                onClick={() => {}}
              />

              <div
                className="-mt-24 flex justify-center px-6 pb-2"
                onClick={(event) => event.stopPropagation()}
              >
                {renderLockedAction()}
              </div>
            </>
          ) : (
            <>
              {renderMedia()}

              <p className="whitespace-pre-wrap text-[15px] leading-7 text-zinc-100">
                {text}
              </p>

              <p className="text-xs text-zinc-500">{createdAt}</p>
            </>
          )}
        </div>
      </div>
    </article>
  )
}