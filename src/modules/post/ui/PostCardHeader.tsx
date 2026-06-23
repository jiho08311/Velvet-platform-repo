"use client"

import { PostMoreMenu } from "./PostMoreMenu"
import type { PostCardCreator } from "./PostCard"

type PostCardHeaderProps = {
  creator: PostCardCreator
  postId?: string
  pathname: string | null
  currentUserId?: string
  onCreatorClick: (event: React.MouseEvent) => void
}

const POST_CARD_HEADER_CLASSES = {
  root: "flex items-center justify-between px-0",
  creatorButton: "flex items-center gap-3 text-left",
  avatarImage: "h-11 w-11 rounded-full object-cover",
  avatarFallback:
    "flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white",
  creatorNameContainer: "min-w-0",
  creatorName: "truncate text-[15px] font-semibold text-white",
} as const

export function PostCardHeader({
  creator,
  postId,
  pathname,
  currentUserId,
  onCreatorClick,
}: PostCardHeaderProps) {
  const creatorName = creator.displayName ?? creator.username
  const creatorInitial = creatorName.slice(0, 1).toUpperCase()

  return (
    <div className={POST_CARD_HEADER_CLASSES.root}>
      <button
        type="button"
        onClick={onCreatorClick}
        className={POST_CARD_HEADER_CLASSES.creatorButton}
      >
        {creator.avatarUrl ? (
          <img
            src={creator.avatarUrl}
            alt={creatorName}
            className={POST_CARD_HEADER_CLASSES.avatarImage}
          />
        ) : (
          <div className={POST_CARD_HEADER_CLASSES.avatarFallback}>
            {creatorInitial}
          </div>
        )}

        <div className={POST_CARD_HEADER_CLASSES.creatorNameContainer}>
          <p className={POST_CARD_HEADER_CLASSES.creatorName}>{creatorName}</p>
        </div>
      </button>

      {postId ? (
        <div onClick={(event) => event.stopPropagation()}>
          <PostMoreMenu
            postId={postId}
            pathname={pathname ?? ""}
            currentUserId={currentUserId}
          />
        </div>
      ) : null}
    </div>
  )
}
