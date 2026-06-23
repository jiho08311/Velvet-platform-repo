"use client"

import { useRef, useState } from "react"
import type {
  PostNormalizedRenderGroup,
  PostRenderInput,
  PostRenderMediaItem,
} from "@/modules/post/types"
import {
  PostCardMediaSection,
  type PostCardMediaEntry,
} from "./PostCardMediaSection"

type PostCardRenderSectionsProps = {
  renderInput: PostRenderInput
}

type PostCardRenderSection =
  | {
      kind: "text"
      key: string
      text: string
      containerClassName: string
      textClassName: string
    }
  | {
      kind: "media"
      key: string
      items: PostRenderMediaItem[]
      mediaEntries?: PostCardMediaEntry[]
      isCarousel: boolean
      hasVideoBlock: boolean
    }

export function PostCardRenderSections({
  renderInput,
}: PostCardRenderSectionsProps) {
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const {
    hasBlocks,
    blockText,
    blockMedia,
    normalizedGroups,
    resolvedMediaEntries,
  } = renderInput

  const hasNormalizedGroups = normalizedGroups.length > 0
  const shouldRenderNormalizedGroups = hasBlocks && hasNormalizedGroups
  const renderSections: PostCardRenderSection[] = shouldRenderNormalizedGroups
    ? normalizedGroups.map(renderNormalizedGroup)
    : [
        ...(blockMedia.length > 0
          ? [
              {
                kind: "media" as const,
                key: "fallback-media",
                items: blockMedia,
                isCarousel: false,
                hasVideoBlock: false,
              },
            ]
          : []),
        ...(blockText
          ? [
              {
                kind: "text" as const,
                key: "fallback-text",
                text: blockText,
                containerClassName: "px-0 pt-3",
                textClassName:
                  "whitespace-pre-wrap text-[16px] leading-7 text-white font-medium",
              },
            ]
          : []),
      ]

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const scrollLeft = event.currentTarget.scrollLeft
    const width = event.currentTarget.clientWidth
    const index = Math.round(scrollLeft / width)
    setCurrentIndex(index)
  }

  function renderSection(section: PostCardRenderSection) {
    if (section.kind === "text") {
      return (
        <div key={section.key} className={section.containerClassName}>
          <p className={section.textClassName}>{section.text}</p>
        </div>
      )
    }

    const mediaItems = section.items
    return (
      <div key={section.key} className="overflow-hidden">
        {mediaItems.length > 0 ? (
          <PostCardMediaSection
            items={mediaItems}
            mediaEntries={section.mediaEntries}
            fallbackEntries={resolvedMediaEntries}
            isCarousel={section.isCarousel}
            currentIndex={currentIndex}
            isVideoReady={isVideoReady}
            videoRefs={videoRefs}
            onScroll={handleScroll}
            onVideoReady={() => setIsVideoReady(true)}
          />
        ) : (
          <div className="mt-2 flex min-h-[220px] items-center justify-center bg-zinc-900 text-sm text-zinc-500">
            {section.hasVideoBlock
              ? "Video is processing..."
              : "Media not available"}
          </div>
        )}
      </div>
    )
  }

  return <>{renderSections.map(renderSection)}</>
}

function renderNormalizedGroup(
  group: PostNormalizedRenderGroup,
  index: number
): PostCardRenderSection {
  if (group.type === "text") {
    return {
      kind: "text",
      key: group.block.id,
      text: group.block.content ?? "",
      containerClassName: "px-3 pt-3",
      textClassName:
        "whitespace-pre-wrap text-[15px] leading-7 text-white font-medium",
    }
  }

  return {
    kind: "media",
    key: `media-group-${index}`,
    items: group.mediaEntries.map((entry) => entry.media),
    mediaEntries: group.mediaEntries,
    isCarousel: group.variant === "carousel",
    hasVideoBlock: group.blocks.some((block) => block.type === "video"),
  }
}
