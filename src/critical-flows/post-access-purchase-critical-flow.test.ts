import assert from "node:assert/strict"
import test from "node:test"

import {
  buildLockedPreviewPolicy,
  getPostPurchaseEligibility,
  resolvePostAccessPolicy,
} from "@/modules/post/public/post-policy-contracts"
import { canViewPost } from "@/modules/post/public/can-view-post"
import type { Post } from "@/modules/post/types"

const paidPost = {
  visibility: "paid",
  price: 1200,
} as Post

test("critical post access keeps subscriber and paid posts locked without entitlement", () => {
  assert.equal(
    canViewPost({
      visibility: "subscribers",
      viewerUserId: "viewer_1",
      creatorUserId: "creator_user_1",
      isSubscribed: false,
      hasPurchased: false,
    }),
    false
  )

  assert.equal(
    canViewPost({
      visibility: "paid",
      viewerUserId: "viewer_1",
      creatorUserId: "creator_user_1",
      isSubscribed: false,
      hasPurchased: false,
    }),
    false
  )
})

test("critical post access unlocks public, owner, subscriber, and purchased posts only through explicit authority", () => {
  assert.equal(
    canViewPost({
      visibility: "public",
      viewerUserId: null,
      creatorUserId: "creator_user_1",
      isSubscribed: false,
      hasPurchased: false,
    }),
    true
  )

  assert.equal(
    canViewPost({
      visibility: "paid",
      viewerUserId: "creator_user_1",
      creatorUserId: "creator_user_1",
      isSubscribed: false,
      hasPurchased: false,
    }),
    true
  )

  assert.equal(
    canViewPost({
      visibility: "subscribers",
      viewerUserId: "viewer_1",
      creatorUserId: "creator_user_1",
      isSubscribed: true,
      hasPurchased: false,
    }),
    true
  )

  assert.equal(
    canViewPost({
      visibility: "paid",
      viewerUserId: "viewer_1",
      creatorUserId: "creator_user_1",
      isSubscribed: false,
      hasPurchased: true,
    }),
    true
  )
})

test("critical post access maps locked subscriber and paid posts to stable lock reasons", () => {
  assert.deepEqual(
    resolvePostAccessPolicy({
      visibility: "subscribers",
      viewerUserId: "viewer_1",
      creatorUserId: "creator_user_1",
      isSubscribed: false,
      hasPurchased: false,
    }),
    {
      canView: false,
      isLocked: true,
      lockReason: "subscription",
    }
  )

  assert.deepEqual(
    resolvePostAccessPolicy({
      visibility: "paid",
      viewerUserId: "viewer_1",
      creatorUserId: "creator_user_1",
      isSubscribed: false,
      hasPurchased: false,
    }),
    {
      canView: false,
      isLocked: true,
      lockReason: "purchase",
    }
  )
})

test("critical locked preview hides full paid content while exposing only preview-safe content", () => {
  const lockedPreview = buildLockedPreviewPolicy({
    access: {
      canView: false,
      isLocked: true,
      lockReason: "purchase",
    },
    publicState: "published",
    text: "full paid post body",
    blocks: [
      {
        id: "block_image",
        postId: "post_1",
        type: "image",
        content: null,
        mediaId: "media_private",
        sortOrder: 2,
        createdAt: "2026-06-22T00:00:00.000Z",
        editorState: null,
      },
      {
        id: "block_preview",
        postId: "post_1",
        type: "text",
        content: "preview only",
        mediaId: null,
        sortOrder: 1,
        createdAt: "2026-06-22T00:00:00.000Z",
        editorState: null,
      },
    ],
    media: [],
  })

  assert.equal(lockedPreview.canViewFullContent, false)
  assert.equal(lockedPreview.shouldHideFullContent, true)
  assert.equal(lockedPreview.shouldRenderLockedPreview, true)
  assert.equal(lockedPreview.previewVariant, "purchase")
  assert.equal(lockedPreview.renderTextSeed, "preview only")
  assert.deepEqual(
    lockedPreview.previewBlocks.map((block) => block.id),
    ["block_preview"]
  )
})

test("critical post purchase eligibility allows purchase only before entitlement exists", () => {
  assert.deepEqual(
    getPostPurchaseEligibility({
      post: paidPost,
      isOwner: false,
      hasPurchased: false,
      isSubscribed: false,
    }),
    {
      canPurchase: true,
      blockingReason: null,
    }
  )

  assert.deepEqual(
    getPostPurchaseEligibility({
      post: paidPost,
      isOwner: false,
      hasPurchased: true,
      isSubscribed: false,
    }),
    {
      canPurchase: false,
      blockingReason: "already_purchased",
    }
  )

  assert.deepEqual(
    getPostPurchaseEligibility({
      post: paidPost,
      isOwner: true,
      hasPurchased: false,
      isSubscribed: false,
    }),
    {
      canPurchase: false,
      blockingReason: "owner",
    }
  )
})
