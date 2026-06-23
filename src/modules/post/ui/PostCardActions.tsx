"use client"

import {
  ChatBubbleOvalLeftIcon,
  HeartIcon as HeartOutline,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline"
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid"
import { formatInUserTimeZone } from "@/shared/lib/date-time"

type PostCardActionsProps = {
  createdAt: string
  currentLikesCount: number
  currentViewerHasLiked: boolean
  displayCommentCount: number
  isLikeLoading: boolean
  onLike: (event: React.MouseEvent<HTMLButtonElement>) => void
  onCommentsToggle: (event: React.MouseEvent<HTMLButtonElement>) => void
  onCreatorMessageClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const POST_CARD_ACTION_CLASSES = {
  root: "flex items-center gap-4 px-0 pt-3",
  button:
    "flex items-center gap-1.5 p-2 text-zinc-300 hover:text-white active:scale-95",
  likedIcon: "h-6 w-6 text-pink-500",
  icon: "h-6 w-6 stroke-[2.5]",
  count: "text-[14px] font-semibold",
  date: "text-[13px] text-zinc-400",
} as const

function formatPostDate(value: string) {
  return formatInUserTimeZone(value, { withTime: false })
}

export function PostCardActions({
  createdAt,
  currentLikesCount,
  currentViewerHasLiked,
  displayCommentCount,
  isLikeLoading,
  onLike,
  onCommentsToggle,
  onCreatorMessageClick,
}: PostCardActionsProps) {
  return (
    <div className={POST_CARD_ACTION_CLASSES.root}>
      <button
        type="button"
        onClick={onLike}
        disabled={isLikeLoading}
        className={POST_CARD_ACTION_CLASSES.button}
      >
        {currentViewerHasLiked ? (
          <HeartSolid className={POST_CARD_ACTION_CLASSES.likedIcon} />
        ) : (
          <HeartOutline className={POST_CARD_ACTION_CLASSES.icon} />
        )}
        <span className={POST_CARD_ACTION_CLASSES.count}>
          {currentLikesCount}
        </span>
      </button>

      <button
        type="button"
        onClick={onCommentsToggle}
        className={POST_CARD_ACTION_CLASSES.button}
      >
        <ChatBubbleOvalLeftIcon className={POST_CARD_ACTION_CLASSES.icon} />
        <span className={POST_CARD_ACTION_CLASSES.count}>
          {displayCommentCount}
        </span>
      </button>

      <button
        type="button"
        onClick={onCreatorMessageClick}
        className={POST_CARD_ACTION_CLASSES.button}
      >
        <PaperAirplaneIcon className={POST_CARD_ACTION_CLASSES.icon} />
      </button>

      <p className={POST_CARD_ACTION_CLASSES.date}>{formatPostDate(createdAt)}</p>
    </div>
  )
}
