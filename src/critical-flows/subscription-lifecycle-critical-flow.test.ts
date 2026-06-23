import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import {
  canAccessSubscription,
  resolveSubscriptionState,
} from "@/modules/subscription/public/subscription-policy-contracts"
import { canViewPost } from "@/modules/post/public/can-view-post"
import { getStoryAccessState } from "@/modules/story/public/story-policy-contracts"

const CHECK_SUBSCRIPTION_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/subscription/runtime/check-subscription.ts"
)
const CREATOR_ENTITLEMENT_USE_CASE_PATH = join(
  process.cwd(),
  "src/modules/commerce/application/entitlement/can-access-creator-use-case.ts"
)
const POST_ACCESS_ENTITLEMENT_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/post/runtime/resolve-post-access-entitlement.ts"
)
const STORY_ITEM_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/story/runtime/get-stories-item.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

function indexAfter(source: string, pattern: string, from = 0): number {
  const index = source.indexOf(pattern, from)
  assert.ok(index > -1, `Expected to find ${pattern}`)
  return index
}

test("critical subscription lifecycle grants access only to active access state", () => {
  assert.equal(canAccessSubscription({ accessState: "active" }), true)
  assert.equal(canAccessSubscription({ accessState: "inactive" }), false)
})

test("critical subscription lifecycle keeps active and ending subscriptions accessible until period end", () => {
  const now = new Date("2026-06-22T00:00:00.000Z")

  assert.deepEqual(
    resolveSubscriptionState({
      status: "active",
      currentPeriodEndAt: "2026-07-22T00:00:00.000Z",
      cancelAtPeriodEnd: false,
      now,
    }),
    {
      accessState: "active",
      displayState: "active",
      hasAccess: true,
      isExpired: false,
      isCancelScheduled: false,
      endsAt: "2026-07-22T00:00:00.000Z",
    }
  )

  assert.deepEqual(
    resolveSubscriptionState({
      status: "active",
      currentPeriodEndAt: "2026-07-22T00:00:00.000Z",
      cancelAtPeriodEnd: true,
      now,
    }),
    {
      accessState: "active",
      displayState: "ending",
      hasAccess: true,
      isExpired: false,
      isCancelScheduled: true,
      endsAt: "2026-07-22T00:00:00.000Z",
    }
  )

  assert.deepEqual(
    resolveSubscriptionState({
      status: "canceled",
      currentPeriodEndAt: "2026-07-22T00:00:00.000Z",
      cancelAtPeriodEnd: true,
      canceledAt: "2026-06-20T00:00:00.000Z",
      now,
    }),
    {
      accessState: "active",
      displayState: "ending",
      hasAccess: true,
      isExpired: false,
      isCancelScheduled: true,
      endsAt: "2026-07-22T00:00:00.000Z",
    }
  )
})

test("critical subscription lifecycle blocks expired, canceled past, and inactive subscriptions", () => {
  const now = new Date("2026-06-22T00:00:00.000Z")

  assert.equal(
    resolveSubscriptionState({
      status: "active",
      currentPeriodEndAt: "2026-06-21T23:59:59.000Z",
      now,
    }).hasAccess,
    false
  )

  assert.equal(
    resolveSubscriptionState({
      status: "expired",
      currentPeriodEndAt: "2026-06-21T23:59:59.000Z",
      now,
    }).hasAccess,
    false
  )

  assert.equal(
    resolveSubscriptionState({
      status: "canceled",
      currentPeriodEndAt: "2026-06-21T23:59:59.000Z",
      canceledAt: "2026-06-20T00:00:00.000Z",
      now,
    }).hasAccess,
    false
  )

  assert.equal(
    resolveSubscriptionState({
      status: "incomplete",
      currentPeriodEndAt: "2026-07-22T00:00:00.000Z",
      now,
    }).hasAccess,
    false
  )
})

test("critical subscriber-only post and story access require explicit subscription or owner authority", () => {
  assert.equal(
    canViewPost({
      visibility: "subscribers",
      viewerUserId: "viewer_1",
      creatorUserId: "creator_user_1",
      isSubscribed: false,
    }),
    false
  )

  assert.equal(
    canViewPost({
      visibility: "subscribers",
      viewerUserId: "viewer_1",
      creatorUserId: "creator_user_1",
      isSubscribed: true,
    }),
    true
  )

  assert.equal(
    getStoryAccessState({
      visibility: "subscribers",
      isOwner: false,
      hasSubscriptionAccess: false,
    }),
    "visible_locked"
  )

  assert.equal(
    getStoryAccessState({
      visibility: "subscribers",
      isOwner: false,
      hasSubscriptionAccess: true,
    }),
    "visible_unlocked"
  )

  assert.equal(
    getStoryAccessState({
      visibility: "subscribers",
      isOwner: true,
      hasSubscriptionAccess: false,
    }),
    "visible_unlocked"
  )
})

test("critical checkSubscription returns only getViewerSubscription isActive after validation traceability", () => {
  const source = read(CHECK_SUBSCRIPTION_RUNTIME_PATH)

  const trimUser = indexAfter(source, "const resolvedUserId = userId.trim()")
  const trimCreator = indexAfter(source, "const resolvedCreatorId = creatorId.trim()", trimUser)
  const emptyGuard = indexAfter(source, "if (!resolvedUserId || !resolvedCreatorId)", trimCreator)
  const getViewerSubscription = indexAfter(
    source,
    "const viewerSubscription = await getViewerSubscription",
    emptyGuard
  )
  const validation = indexAfter(
    source,
    "const validationResult: SubscriptionValidationResult",
    getViewerSubscription
  )
  const trace = indexAfter(
    source,
    "await synchronizeSubscriptionValidationBoundaryNoThrow",
    validation
  )
  const financialTrace = indexAfter(
    source,
    "await synchronizeFinancialIdentityCorrelationNoThrow",
    trace
  )
  const returned = indexAfter(source, "return validationResult.isActive", financialTrace)

  assert.ok(trimCreator > trimUser)
  assert.ok(emptyGuard > trimCreator)
  assert.ok(getViewerSubscription > emptyGuard)
  assert.ok(validation > getViewerSubscription)
  assert.ok(trace > validation)
  assert.ok(financialTrace > trace)
  assert.ok(returned > financialTrace)
})

test("critical creator entitlement maps canonical subscription access to stable decision reasons", () => {
  const source = read(CREATOR_ENTITLEMENT_USE_CASE_PATH)

  const unauthenticated = indexAfter(source, 'reason: "unauthenticated"')
  const canonicalAccess = indexAfter(source, "await checkCanonicalCreatorAccess", unauthenticated)
  const allowedSource = indexAfter(source, 'source: allowed ? "subscription" : "none"', canonicalAccess)
  const allowedReason = indexAfter(
    source,
    'reason: allowed ? "active_subscription" : "not_subscribed"',
    allowedSource
  )

  assert.ok(canonicalAccess > unauthenticated)
  assert.ok(allowedSource > canonicalAccess)
  assert.ok(allowedReason > allowedSource)
})

test("critical post and story subscriber access flows consume canAccessCreator decisions", () => {
  const postSource = read(POST_ACCESS_ENTITLEMENT_RUNTIME_PATH)
  const storySource = read(STORY_ITEM_RUNTIME_PATH)

  const postOwner = indexAfter(postSource, "if (isOwner)")
  const postCanAccessCreator = indexAfter(postSource, "await canAccessCreator", postOwner)
  const postSubscribed = indexAfter(
    postSource,
    "isSubscribed = creatorAccess.decision.allowed",
    postCanAccessCreator
  )
  const postAccess = indexAfter(postSource, "const access = await getPostAccess", postSubscribed)

  assert.ok(postCanAccessCreator > postOwner)
  assert.ok(postSubscribed > postCanAccessCreator)
  assert.ok(postAccess > postSubscribed)

  const storyVisibilityGuard = indexAfter(
    storySource,
    'input.story.row.visibility !== "subscribers" || input.isOwner'
  )
  const storyCanAccessCreator = indexAfter(storySource, "await canAccessCreator", storyVisibilityGuard)
  const storyAllowed = indexAfter(storySource, "return decision.allowed", storyCanAccessCreator)
  const storyAccessState = indexAfter(
    storySource,
    "const accessState = getStoryAccessState",
    storyAllowed
  )

  assert.ok(storyCanAccessCreator > storyVisibilityGuard)
  assert.ok(storyAllowed > storyCanAccessCreator)
  assert.ok(storyAccessState > storyAllowed)
})
