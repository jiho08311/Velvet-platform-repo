"use client"

import { usePathname, useRouter } from "next/navigation"

import SubscribeButton from "@/modules/creator/ui/SubscribeButton"
import { ReportButton } from "@/modules/report/ui/ReportButton"

import { LockedPostCard } from "./LockedPostCard"
import PostPurchaseButton from "./PostPurchaseButton"

type MediaItem = {
  url: string
  type?: "image" | "video" | "audio" | "file"
}

type PostCardProps = {
  postId?: string
  text: string
  createdAt: string
  mediaThumbnailUrls?: string[]
  media?: MediaItem[]
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

function getPreviewTitle(text: string) {
  const normalized = text.trim()

  if (!normalized) {
    return "Untitled post"
  }

  const firstLine = normalized.split("\n").find((line) => line.trim().length > 0)

  if (!firstLine) {
    return "Untitled post"
  }

  return firstLine.length > 72 ? `${firstLine.slice(0, 72)}...` : firstLine
}

function getPreviewBody(text: string) {
  const normalized = text.trim()

  if (!normalized) {
    return ""
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length <= 1) {
    return normalized
  }

  return lines.slice(1).join(" ")
}

export function PostCard({
  postId,
  text,
  createdAt,
  mediaThumbnailUrls = [],
  media = [],
  isLocked = false,
  lockReason = "none",
  priceCents,
  creatorId,
  creatorUserId,
  currentUserId,
  creator,
}: PostCardProps) {
  const router = useRouter()
  const pathname = usePathname()

  const creatorName = creator.displayName ?? creator.username
  const creatorInitial = creatorName.slice(0, 1).toUpperCase()
  const previewTitle = getPreviewTitle(text)
  const previewBody = getPreviewBody(text)

  const resolvedMedia =
    media.length > 0
      ? media
      : mediaThumbnailUrls.map((url) => ({
          url,
          type: "image" as const,
        }))

  function handleCardClick() {
    if (!postId || isLocked) return
    router.push(`/post/${postId}`)
  }

  function renderSingleMedia(item: MediaItem, alt: string) {
    const mediaUrl = item.url?.trim() ?? ""
    if (!mediaUrl) return null

    if (item.type === "video") {
      return (
        <video
          src={mediaUrl}
          controls
          playsInline
          className="h-full w-full object-cover"
        />
      )
    }

    if (item.type === "audio") {
      return (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-4">
          <audio controls className="w-full">
            <source src={mediaUrl} />
          </audio>
        </div>
      )
    }

    if (item.type === "file") {
      return (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-4">
          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            Open file
          </a>
        </div>
      )
    }

    return (
      <img
        src={mediaUrl}
        alt={alt}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      />
    )
  }

  function renderMedia() {
    if (resolvedMedia.length === 0) return null

    if (resolvedMedia.length === 1) {
      const item = resolvedMedia[0]

      return (
        <div className="overflow-hidden rounded-2xl bg-zinc-950">
          <div className="aspect-[4/5] w-full overflow-hidden">
            {renderSingleMedia(item, "Post media")}
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-zinc-950">
        {resolvedMedia.slice(0, 2).map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className="aspect-square overflow-hidden bg-zinc-900"
          >
            {renderSingleMedia(item, `Post media ${index + 1}`)}
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
            creatorUsername={creator.username}
            embedded
          />
        </div>
      )
    }

    if (lockReason === "purchase" && postId) {
      return (
        <div onClick={(event) => event.stopPropagation()}>
          {/* 🔥 핵심 수정 */}
          <PostPurchaseButton
            postId={postId}
            priceCents={priceCents}
            creatorUsername={creator.username}
            embedded
          />
        </div>
      )
    }

    return null
  }

  return (
    <article
      onClick={handleCardClick}
      className={`group overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-900/70 p-4 transition-all duration-200 hover:border-zinc-700 hover:shadow-xl sm:p-5 ${
        isLocked ? "cursor-default" : "cursor-pointer"
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

        <div className="space-y-4">
          {isLocked ? (
            <LockedPostCard
              previewText={text}
              createdAt={createdAt}
              previewThumbnailUrl={resolvedMedia[0]?.url ?? null}
              priceCents={priceCents}
              lockReason={
                lockReason === "subscription" || lockReason === "purchase"
                  ? lockReason
                  : undefined
              }
              action={renderLockedAction()}
            />
          ) : (
            <>
              {renderMedia()}

              <div className="space-y-2">
                <p className="line-clamp-2 text-base font-semibold leading-7 text-white sm:text-lg">
                  {previewTitle}
                </p>

                {previewBody ? (
                  <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                    {previewBody}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">{createdAt}</p>

                {postId ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ReportButton
                      targetType="post"
                      targetId={postId}
                      pathname={pathname}
                    />
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  )
}