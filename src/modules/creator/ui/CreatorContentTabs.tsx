"use client"

import { useState } from "react"
import { EmptyState } from "@/shared/ui/EmptyState"
import { CreatorContentTabButton } from "./CreatorContentTabButton"
import { CreatorMediaPostTile } from "./CreatorMediaPostTile"
import { CreatorUpdatePostCard } from "./CreatorUpdatePostCard"
import { CREATOR_SURFACE_EMPTY_STATE } from "./creator-surface-policy"
import type {
  CreatorContentTab,
  CreatorContentTabPost,
} from "./creator-content-tabs-types"

type CreatorContentTabsProps = {
  mediaPosts: CreatorContentTabPost[]
  updatePosts: CreatorContentTabPost[]
  isOwner: boolean
}

export function CreatorContentTabs({
  mediaPosts,
  updatePosts,
  isOwner,
}: CreatorContentTabsProps) {
  const [activeTab, setActiveTab] = useState<CreatorContentTab>("posts")

  return (
    <section className="flex flex-col">
      <div className="-mx-4 border-y border-zinc-800 lg:-mx-0">
        <div className="grid grid-cols-2">
          <CreatorContentTabButton
            tab="posts"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />

          <CreatorContentTabButton
            tab="updates"
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
        </div>
      </div>

      {activeTab === "posts" ? (
        <CreatorMediaPostGrid mediaPosts={mediaPosts} isOwner={isOwner} />
      ) : (
        <CreatorUpdatePostList updatePosts={updatePosts} isOwner={isOwner} />
      )}
    </section>
  )
}

type CreatorMediaPostGridProps = {
  mediaPosts: CreatorContentTabPost[]
  isOwner: boolean
}

function CreatorMediaPostGrid({
  mediaPosts,
  isOwner,
}: CreatorMediaPostGridProps) {
  if (mediaPosts.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          title={CREATOR_SURFACE_EMPTY_STATE.postsTab.title}
          description={CREATOR_SURFACE_EMPTY_STATE.postsTab.description}
        />
      </div>
    )
  }

  return (
    <div className="mt-4 -mx-4 grid grid-cols-3 gap-[2px] lg:mx-0">
      {mediaPosts.map((post) => (
        <CreatorMediaPostTile key={post.id} post={post} isOwner={isOwner} />
      ))}
    </div>
  )
}

type CreatorUpdatePostListProps = {
  updatePosts: CreatorContentTabPost[]
  isOwner: boolean
}

function CreatorUpdatePostList({
  updatePosts,
  isOwner,
}: CreatorUpdatePostListProps) {
  if (updatePosts.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          title={CREATOR_SURFACE_EMPTY_STATE.updatesTab.title}
          description={CREATOR_SURFACE_EMPTY_STATE.updatesTab.description}
        />
      </div>
    )
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {updatePosts.map((post) => (
        <CreatorUpdatePostCard key={post.id} post={post} isOwner={isOwner} />
      ))}
    </div>
  )
}
