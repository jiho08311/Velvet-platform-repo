import assert from "node:assert/strict"
import test from "node:test"

import {
  getStoryAccessState,
  getStorySurfaceEligibility,
} from "@/modules/story/public/story-policy-contracts"

const visibleCreator = {
  status: "active",
  creatorVisibilityState: "public_candidate",
}

const visibleProfile = {
  profileLifecycleState: "active",
  identityVisibilityState: "visible",
  isDeactivated: false,
  isDeletePending: false,
  deletedAt: null,
  isBanned: false,
}

test("critical story access unlocks public stories and owner stories", () => {
  assert.equal(
    getStoryAccessState({
      visibility: "public",
      isOwner: false,
      hasSubscriptionAccess: false,
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

test("critical story access locks subscriber stories without entitlement", () => {
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
})

test("critical story eligibility excludes deleted, expired, invalid, and hidden creators", () => {
  const now = "2026-06-22T00:00:00.000Z"

  assert.equal(
    getStorySurfaceEligibility({
      now,
      story: {
        isDeleted: true,
        expiresAt: "2026-06-23T00:00:00.000Z",
      },
      creator: visibleCreator,
      profile: visibleProfile,
    }),
    "excluded"
  )

  assert.equal(
    getStorySurfaceEligibility({
      now,
      story: {
        isDeleted: false,
        expiresAt: "2026-06-21T23:59:59.000Z",
      },
      creator: visibleCreator,
      profile: visibleProfile,
    }),
    "excluded"
  )

  assert.equal(
    getStorySurfaceEligibility({
      now,
      story: {
        isDeleted: false,
        expiresAt: "not-a-date",
      },
      creator: visibleCreator,
      profile: visibleProfile,
    }),
    "excluded"
  )

  assert.equal(
    getStorySurfaceEligibility({
      now,
      story: {
        isDeleted: false,
        expiresAt: "2026-06-23T00:00:00.000Z",
      },
      creator: {
        status: "suspended",
        creatorVisibilityState: "not_public",
      },
      profile: visibleProfile,
    }),
    "excluded"
  )
})

test("critical story eligibility includes active non-expired visible creator stories", () => {
  assert.equal(
    getStorySurfaceEligibility({
      now: "2026-06-22T00:00:00.000Z",
      story: {
        isDeleted: false,
        expiresAt: "2026-06-23T00:00:00.000Z",
      },
      creator: visibleCreator,
      profile: visibleProfile,
    }),
    "included"
  )
})
