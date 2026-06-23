import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { resolveStoryReadWriteEligibility } from "@/modules/story/public/story-policy-contracts"
import type { StoryReadWriteEligibilityStory } from "@/modules/story/types"

const STORY_READ_STATE_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/story/runtime/story-read-state.ts"
)

const eligibleStory: StoryReadWriteEligibilityStory = {
  id: "story_1",
  creatorId: "creator_1",
  expiresAt: "2999-01-01T00:00:00.000Z",
  isDeleted: false,
  isLocked: false,
}

function read(path: string): string {
  return readFileSync(path, "utf8")
}

function indexAfter(source: string, pattern: string, from = 0): number {
  const index = source.indexOf(pattern, from)
  assert.ok(index > -1, `Expected to find ${pattern}`)
  return index
}

test("critical story read-state permits persistence only for the exact eligible story", () => {
  assert.deepEqual(
    resolveStoryReadWriteEligibility({
      creatorId: "creator_1",
      storyId: "story_1",
      story: eligibleStory,
    }),
    {
      canPersist: true,
      validLastSeenStoryId: "story_1",
      reason: "eligible",
    }
  )
})

test("critical story read-state blocks missing, mismatched, deleted, expired, and locked stories", () => {
  const blockedCases: Array<{
    name: string
    storyId: string
    story: StoryReadWriteEligibilityStory | null
    reason:
      | "story_missing"
      | "creator_mismatch"
      | "story_deleted"
      | "story_expired"
      | "story_locked"
  }> = [
    {
      name: "missing",
      storyId: "story_missing",
      story: null,
      reason: "story_missing",
    },
    {
      name: "creator mismatch",
      storyId: "story_1",
      story: {
        ...eligibleStory,
        creatorId: "other_creator",
      },
      reason: "creator_mismatch",
    },
    {
      name: "story id mismatch",
      storyId: "other_story",
      story: eligibleStory,
      reason: "creator_mismatch",
    },
    {
      name: "deleted",
      storyId: "story_1",
      story: {
        ...eligibleStory,
        isDeleted: true,
      },
      reason: "story_deleted",
    },
    {
      name: "expired",
      storyId: "story_1",
      story: {
        ...eligibleStory,
        expiresAt: "2000-01-01T00:00:00.000Z",
      },
      reason: "story_expired",
    },
    {
      name: "invalid expiry",
      storyId: "story_1",
      story: {
        ...eligibleStory,
        expiresAt: "not-a-date",
      },
      reason: "story_expired",
    },
    {
      name: "locked",
      storyId: "story_1",
      story: {
        ...eligibleStory,
        isLocked: true,
      },
      reason: "story_locked",
    },
  ]

  for (const blockedCase of blockedCases) {
    assert.deepEqual(
      resolveStoryReadWriteEligibility({
        creatorId: "creator_1",
        storyId: blockedCase.storyId,
        story: blockedCase.story,
      }),
      {
        canPersist: false,
        validLastSeenStoryId: null,
        reason: blockedCase.reason,
      },
      blockedCase.name
    )
  }
})

test("critical markStoryReadState resolves eligibility before writing read-state", () => {
  const source = read(STORY_READ_STATE_RUNTIME_PATH)

  const target = indexAfter(source, "const target = await getStoryReadTarget")
  const surfaceEligibility = indexAfter(
    source,
    "const surfaceEligibility =",
    target
  )
  const resolution = indexAfter(
    source,
    "const resolution = resolveStoryReadWriteEligibility",
    surfaceEligibility
  )
  const reject = indexAfter(source, "if (!resolution.canPersist", resolution)
  const write = indexAfter(source, "await upsertStoryReadState", reject)
  const persistedId = indexAfter(
    source,
    "lastSeenStoryId: resolution.validLastSeenStoryId",
    write
  )

  assert.ok(surfaceEligibility > target)
  assert.ok(resolution > surfaceEligibility)
  assert.ok(reject > resolution)
  assert.ok(write > reject)
  assert.ok(persistedId > write)
})
