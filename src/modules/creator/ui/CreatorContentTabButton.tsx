"use client"

import { CREATOR_CONTENT_TAB_LABELS } from "./creator-surface-policy"
import type { CreatorContentTab } from "./creator-content-tabs-types"

type CreatorTabButtonProps = {
  tab: CreatorContentTab
  activeTab: CreatorContentTab
  onSelect: (tab: CreatorContentTab) => void
}

export function CreatorContentTabButton({
  tab,
  activeTab,
  onSelect,
}: CreatorTabButtonProps) {
  const isActive = activeTab === tab

  return (
    <button
      type="button"
      onClick={() => onSelect(tab)}
      className={`flex items-center justify-center border-b-2 py-3 ${
        isActive
          ? "border-white text-white"
          : "border-transparent text-zinc-500"
      }`}
    >
      <span className="text-sm font-semibold">
        {CREATOR_CONTENT_TAB_LABELS[tab]}
      </span>
    </button>
  )
}
