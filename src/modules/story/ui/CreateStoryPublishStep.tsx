"use client"

import type { Dispatch, SetStateAction } from "react"
import type { StoryEditorDraft } from "../types"
import { StoryPublishPreview } from "./StoryPublishPreview"

type CreateStoryPublishStepProps = {
  draft: StoryEditorDraft
  previewUrl: string | null
  isPending: boolean
  onBack: () => void
  onPublish: () => void
  onDraftChange: Dispatch<SetStateAction<StoryEditorDraft | null>>
}

export function CreateStoryPublishStep({
  draft,
  previewUrl,
  isPending,
  onBack,
  onPublish,
  onDraftChange,
}: CreateStoryPublishStepProps) {
  const draftVisibility = draft.visibility ?? "subscribers"

  return (
    <div className="w-full">
      <div className="space-y-5">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-black transition hover:bg-zinc-100"
          >
            Back
          </button>

          <p className="text-center text-sm font-medium text-black">
            Story settings
          </p>

          <button
            type="button"
            disabled={isPending}
            onClick={onPublish}
            className="min-w-[92px] rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-pink-500 disabled:opacity-50"
          >
            {isPending ? "Publishing..." : "Publish"}
          </button>
        </div>

        <StoryPublishPreview draft={draft} previewUrl={previewUrl} />

        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 space-y-1">
            <p className="text-sm font-medium text-black">Visibility</p>
            <p className="text-xs text-zinc-500">
              Choose who can view this story after publishing.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onDraftChange((prev) =>
                  prev
                    ? {
                        ...prev,
                        visibility: "public",
                      }
                    : prev
                )
              }
              className={`rounded-full border px-4 py-2 text-sm transition ${
                draftVisibility === "public"
                  ? "border-pink-500 bg-pink-500/10 text-black"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Public
            </button>

            <button
              type="button"
              onClick={() =>
                onDraftChange((prev) =>
                  prev
                    ? {
                        ...prev,
                        visibility: "subscribers",
                      }
                    : prev
                )
              }
              className={`rounded-full border px-4 py-2 text-sm transition ${
                draftVisibility === "subscribers"
                  ? "border-pink-500 bg-pink-500/10 text-black"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Subscribers
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
