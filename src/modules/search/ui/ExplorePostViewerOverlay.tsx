"use client"

import {
  ArrowLeftIcon,
  ChatBubbleOvalLeftIcon,
  HeartIcon as HeartOutline,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline"
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid"
import type { DiscoveryPostLinkItem } from "../discovery-contract"
import { SearchExploreCommentsDrawer } from "./SearchExploreCommentsDrawer"
import type { ExplorePostViewerBlock } from "./explore-post-viewer-model"

type ExplorePostViewerOverlayProps = {
  selected: DiscoveryPostLinkItem
  viewerBlocks: ExplorePostViewerBlock[]
  isViewerVisible: boolean
  isLiked: boolean
  likesCount: number
  isLikeLoading: boolean
  isCommentsOpen: boolean
  onClose: () => void
  onLike: () => void
  onOpenComments: () => void
  onMessage: () => void
  onCommentsClose: () => void
  onCommentCreated: () => void
}

export function ExplorePostViewerOverlay({
  selected,
  viewerBlocks,
  isViewerVisible,
  isLiked,
  likesCount,
  isLikeLoading,
  isCommentsOpen,
  onClose,
  onLike,
  onOpenComments,
  onMessage,
  onCommentsClose,
  onCommentCreated,
}: ExplorePostViewerOverlayProps) {
  const creatorName = selected.creatorDisplayName ?? selected.creatorUsername

  return (
    <div
      className={`fixed inset-0 z-[70] bg-black transition duration-200 ${
        isViewerVisible ? "bg-black/95" : "bg-black/0"
      }`}
    >
      <button
        type="button"
        onClick={onClose}
        className={`absolute left-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition duration-200 ${
          isViewerVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-2 opacity-0"
        }`}
      >
        <ArrowLeftIcon className="h-7 w-7" />
      </button>

      <div
        className={`h-full overflow-y-auto transition duration-300 ease-out ${
          isViewerVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
        }`}
      >
        <div className="mx-auto flex min-h-full max-w-3xl flex-col bg-black px-4 pb-5 pt-20">
          <div className="space-y-4">
            {viewerBlocks.map((block) => {
              if (block.kind === "text") {
                return (
                  <p
                    key={block.id}
                    className="whitespace-pre-wrap text-sm leading-6 text-zinc-300"
                  >
                    {block.content}
                  </p>
                )
              }

              const item = block.items[0]

              if (!item) {
                return null
              }

              return (
                <div
                  key={block.id}
                  className="overflow-hidden rounded-2xl bg-zinc-950"
                >
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      className="w-full"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={creatorName}
                      className="w-full object-cover"
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6 border-t border-zinc-800 pt-4">
            <div className="flex items-center gap-4 text-zinc-200">
              <button
                type="button"
                onClick={onLike}
                disabled={isLikeLoading}
                className="flex items-center gap-1.5"
              >
                {isLiked ? (
                  <HeartSolid className="h-6 w-6 text-pink-500" />
                ) : (
                  <HeartOutline className="h-6 w-6 stroke-[2.2]" />
                )}
                <span className="text-sm font-semibold">{likesCount}</span>
              </button>

              <button
                type="button"
                onClick={onOpenComments}
                className="flex items-center gap-1.5"
              >
                <ChatBubbleOvalLeftIcon className="h-6 w-6 stroke-[2.2]" />
                <span className="text-sm font-semibold">
                  {selected.commentsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={onMessage}
                className="flex items-center gap-1.5"
              >
                <PaperAirplaneIcon className="h-6 w-6 stroke-[2.2]" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-white">{creatorName}</p>
            </div>
          </div>
        </div>
      </div>

      <SearchExploreCommentsDrawer
        postId={selected.postId}
        isOpen={isCommentsOpen}
        onClose={onCommentsClose}
        onCommentCreated={onCommentCreated}
      />
    </div>
  )
}
