import {
  CREATOR_SURFACE_EMPTY_STATE,
  CreatorContentTabs,
} from "@/modules/creator/public/creator-page-ui"
import { CreatePostComposer } from "@/modules/post/public/create-post-composer-ui"
import { EmptyState } from "@/shared/ui/EmptyState"
import type { CreatorPageData } from "./creator-page-data"

export function CreatorPageContent({
  creatorId,
  isOwner,
  mediaPosts,
  posts,
  updatePosts,
}: Pick<
  CreatorPageData,
  "isOwner" | "mediaPosts" | "posts" | "updatePosts"
> & {
  creatorId: string
}) {
  return (
    <div className="mt-8">
      {isOwner ? <CreatePostComposer creatorId={creatorId} /> : null}

      {posts.length === 0 ? (
        <EmptyState
          title={CREATOR_SURFACE_EMPTY_STATE.page.title}
          description={CREATOR_SURFACE_EMPTY_STATE.page.description}
        />
      ) : (
        <div>
          <CreatorContentTabs
            mediaPosts={mediaPosts}
            updatePosts={updatePosts}
            isOwner={isOwner}
          />
        </div>
      )}
    </div>
  )
}
