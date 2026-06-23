import { buildPublicCreatorProfileVisibilityInput } from "@/modules/creator/policies/build-public-creator-profile-visibility-input"
import { isPublicCreatorProfileVisible } from "@/modules/creator/policies/is-public-creator-profile-visible"
import {
  buildPostLikeCountMap,
} from "@/shared/lib/post-like-count"
import { listFeedProjectionBlocksByPostIds } from "@/modules/post/public/list-feed-projection-blocks"
import { buildCreatorIdentity } from "@/modules/creator/mappers/build-creator-identity"
import {
  readCreatorRowByUsername,
  readPublicCreatorProfileRowByUserId,
} from "@/modules/creator/repositories/creator-read-repository"
import { listCreatorPublicPosts } from "@/modules/post/public/list-creator-public-posts"
import { getReadyPostMediaRowsByPostIds } from "@/modules/media/public/get-ready-post-media"
import {
  countCommentsByPostIds,
  findPostLikeRowsByPostIds,
  findUserPostLikeRowsByPostIds,
} from "@/modules/post/public/post-interaction-read-model"
import { resolveContentServingAuthorityRuntime } from "@/modules/post/public/content-serving-authority-runtime"
import { canAccessCreator } from "@/modules/commerce/public/entitlement-contract"
import {
  buildCreatorPagePostItem,
  buildCreatorPagePurchasedSet,
} from "./creator-page-runtime-item"
import {
  filterCreatorPageVisiblePosts,
  mapCreatorPageBlocksByPostId,
  mapCreatorPageMediaByPostId,
  mapCreatorPublicPostsForRuntime,
} from "./creator-page-runtime-mappers"
import type { GetCreatorPageInput } from "./creator-page-runtime-types"

export type { GetCreatorPageInput }

async function resolveViewerCreatorAccess({
  viewerUserId,
  creatorId,
}: {
  viewerUserId?: string | null
  creatorId: string
}): Promise<boolean> {
  if (!viewerUserId) {
    return false
  }

  const { decision } = await canAccessCreator({
    viewerUserId,
    creatorId,
  })

  return decision.allowed
}

export async function getCreatorPageRuntime({
  username,
  viewerUserId,
}: GetCreatorPageInput) {
  const normalized = username.trim().toLowerCase()

  if (!normalized) {
    throw new Error("username is required")
  }

  const { data: creator, error: creatorError } =
    await readCreatorRowByUsername(normalized)

  if (creatorError) throw creatorError
  if (!creator) return null

  const { data: profile, error: profileError } =
    await readPublicCreatorProfileRowByUserId(creator.user_id)

  if (profileError) {
    throw profileError
  }

  if (
    !isPublicCreatorProfileVisible(
      buildPublicCreatorProfileVisibilityInput({
        creator: {
          status: creator.status,
          creator_visibility_state: creator.creator_visibility_state,
        },
       profile: profile
  ? {
      is_deactivated: profile.is_deactivated ?? false,
      is_delete_pending: profile.is_delete_pending ?? false,
      deleted_at: profile.deleted_at ?? null,
      is_banned: profile.is_banned ?? false,
    }
  : null,
      })
    )
  ) {
    return null
  }

  if (!profile) {
    return null
  }

  const normalizedProfile = {
  id: profile.id,
  username: profile.username ?? null,
  display_name: profile.display_name ?? null,
  avatar_url: profile.avatar_url ?? null,
  bio: profile.bio ?? null,
  is_deactivated: profile.is_deactivated ?? false,
  is_delete_pending: profile.is_delete_pending ?? false,
  deleted_at: profile.deleted_at ?? null,
  is_banned: profile.is_banned ?? false,
  profileLifecycleState: profile.profileLifecycleState ?? null,
  identityVisibilityState: profile.identityVisibilityState ?? null,
}

const identity = buildCreatorIdentity({
  creator,
  profile: normalizedProfile,
})
  const isSubscribed = await resolveViewerCreatorAccess({
    viewerUserId,
    creatorId: creator.id,
  })
  const now = new Date().toISOString()
  const servingAuthority = await resolveContentServingAuthorityRuntime({
    runtimeSurface: "creator.getCreatorPageRuntime",
    authoritySurface: "creator_page_projection",
  })

  void servingAuthority

  const posts = mapCreatorPublicPostsForRuntime(
    await listCreatorPublicPosts({ creatorId: creator.id })
  )
  const postList = posts.filter((post) => !post.deleted_at)
  const visiblePosts = filterCreatorPageVisiblePosts(postList, now)
  const postIds = visiblePosts.map((post) => post.id)

  const likeRows = await findPostLikeRowsByPostIds(postIds)
  const likeCountMap = buildPostLikeCountMap(likeRows)
  let myLikeSet = new Set<string>()

  if (viewerUserId) {
    const myLikeRows = await findUserPostLikeRowsByPostIds({
      userId: viewerUserId,
      postIds,
    })

    myLikeSet = new Set(myLikeRows.map((row) => row.post_id))
  }

  const commentCountMap = await countCommentsByPostIds(postIds)
  const purchasedSet = await buildCreatorPagePurchasedSet({
    viewerUserId,
    postIds,
  })
  const publishedPostIds = postList
    .filter((post) => post.status === "published")
    .map((post) => post.id)
  const mediaRows = await getReadyPostMediaRowsByPostIds(publishedPostIds)
  const blockRows = await listFeedProjectionBlocksByPostIds(postIds)
  const mediaMap = mapCreatorPageMediaByPostId(mediaRows)
  const blocksMap = mapCreatorPageBlocksByPostId(blockRows)

  const items = await Promise.all(
    visiblePosts.map((post) =>
      buildCreatorPagePostItem({
        post,
        creator,
        identity,
        viewerUserId,
        isSubscribed,
        hasPurchased: purchasedSet.has(post.id),
        blocks: blocksMap.get(post.id) ?? [],
        mediaRows: mediaMap.get(post.id) ?? [],
        likeCountMap,
        myLikeSet,
        commentCountMap,
      })
    )
  )

  return {
    creator: {
      id: identity.id,
      userId: identity.userId,
      username: identity.username,
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      bio: identity.bio,
      isSubscribed,
    },
    posts: items,
  }
}
