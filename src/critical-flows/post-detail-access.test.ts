import test from "node:test"
import assert from "node:assert/strict"

import { findPostCreatorById } from "@/modules/post/repositories/post-repository"
import { readPostAuthority } from "@/modules/post/repositories/post-read-authority-repository"
import {
  getPublicDiscoveryPostState,
  isEligiblePublicDiscoveryCreator,
} from "@/modules/post/public/public-discovery-inclusion"

const CREATOR_ID = "ea0dac42-68be-4dbc-8a1d-dcc778514947"
const POST_ID = "f0a830d9-5603-48e4-873a-a5f74ca4aaa5"

test("canonical active creator with visible profile is public-discovery eligible", async () => {
  const creator = await findPostCreatorById(CREATOR_ID)

  assert.ok(creator)

  const result = isEligiblePublicDiscoveryCreator({
    creator: {
      status: creator.status,
      creatorVisibilityState: creator.creator_visibility_state,
    },
    profile: creator.profiles,
  })

  assert.equal(result, true)
})

test("published subscriber post passes post detail visibility gate", async () => {
  const post = await readPostAuthority(POST_ID)

  assert.ok(post)
  assert.equal(post.id, POST_ID)
  assert.equal(post.creator_id, CREATOR_ID)

  const publicState = getPublicDiscoveryPostState(
    post,
    new Date().toISOString(),
  )

  assert.equal(publicState, "published")
})