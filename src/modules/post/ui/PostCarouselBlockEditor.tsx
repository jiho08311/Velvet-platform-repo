"use client"

import { useState } from "react"
import type { EditorCarouselBlock } from "./create-post-form-model"

type PostCarouselBlockEditorProps = {
  block: EditorCarouselBlock
  onAddMedia: () => void
}

export function PostCarouselBlockEditor({
  block,
  onAddMedia,
}: PostCarouselBlockEditorProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="space-y-3 rounded-[24px] border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">Carousel items</p>

        <button
          type="button"
          onClick={onAddMedia}
          className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Add media
        </button>
      </div>

      {block.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-8 text-center text-sm text-zinc-400">
          No carousel items yet
        </div>
      ) : (
        <div className="relative w-full overflow-hidden rounded-2xl">
          <div
            onScroll={(event) => {
              const scrollLeft = event.currentTarget.scrollLeft
              const width = event.currentTarget.clientWidth
              setActiveIndex(Math.round(scrollLeft / width))
            }}
            className="flex snap-x snap-mandatory overflow-x-auto"
          >
            {block.items.map((item) => (
              <div key={item.id} className="w-full shrink-0 snap-center">
                <div className="aspect-[4/5] w-full overflow-hidden bg-zinc-950">
                  {item.type === "video" ? (
                    <video
                      src={item.previewUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.previewUrl}
                      alt="Carousel item"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {block.items.length > 1 ? (
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {block.items.map((item, index) => (
                <span
                  key={item.id}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === activeIndex ? "bg-[#C2185B]" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
