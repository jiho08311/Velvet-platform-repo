"use client"

import type { RefObject } from "react"
import { Button } from "@/shared/ui/Button"
import type { resolveComposerCTA } from "@/shared/ui/cta-state"
import { FEED_COMPOSER_ACTIONS } from "./feed-surface-policy"
import type { FeedComposerVisibility } from "./feed-composer-model"

type FeedComposerActionBarProps = {
  visibility: FeedComposerVisibility
  selectedItemCount: number
  fileInputRef: RefObject<HTMLInputElement>
  cta: ReturnType<typeof resolveComposerCTA>
  onVisibilityChange: (visibility: FeedComposerVisibility) => void
  onFilesChange: (files: File[]) => void
  onClearFiles: () => void
  onSubmit: () => void
}

const feedComposerActionClassNames = {
  actionBar: "mt-3 flex items-center justify-between gap-3",
  controlGroup: "flex flex-wrap items-center gap-2",
  visibilitySelect:
    "h-11 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-white",
}

export function FeedComposerActionBar({
  visibility,
  selectedItemCount,
  fileInputRef,
  cta,
  onVisibilityChange,
  onFilesChange,
  onClearFiles,
  onSubmit,
}: FeedComposerActionBarProps) {
  return (
    <div className={feedComposerActionClassNames.actionBar}>
      <div className={feedComposerActionClassNames.controlGroup}>
        <select
          value={visibility}
          onChange={(event) =>
            onVisibilityChange(event.target.value as FeedComposerVisibility)
          }
          className={feedComposerActionClassNames.visibilitySelect}
        >
          <option value="public">
            {FEED_COMPOSER_ACTIONS.visibilityPublicLabel}
          </option>
          <option value="subscribers">
            {FEED_COMPOSER_ACTIONS.visibilitySubscribersLabel}
          </option>
        </select>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(event) => onFilesChange(Array.from(event.target.files ?? []))}
          className="hidden"
        />

        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          {FEED_COMPOSER_ACTIONS.attachLabel}
        </Button>

        {selectedItemCount > 0 ? (
          <Button variant="secondary" onClick={onClearFiles}>
            {FEED_COMPOSER_ACTIONS.clearLabel}
          </Button>
        ) : null}
      </div>

      <Button
        onClick={onSubmit}
        disabled={cta.primary.disabled}
        loading={cta.primary.loading}
        loadingLabel={cta.primary.loadingLabel}
      >
        {cta.primary.label}
      </Button>
    </div>
  )
}
