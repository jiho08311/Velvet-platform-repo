import assert from "node:assert/strict"
import test from "node:test"

import {
  toTrustSafetyActionTargetType,
  toTrustSafetyActionType,
} from "@/modules/governance/public/moderation-policy-contracts"

test("critical moderation action policy maps content targets to hide content", () => {
  for (const targetType of ["post", "story", "media"] as const) {
    assert.equal(toTrustSafetyActionTargetType(targetType), targetType.toUpperCase())
    assert.equal(
      toTrustSafetyActionType({
        decision: "rejected",
        targetType,
      }),
      "HIDE_CONTENT"
    )
  }
})

test("critical moderation action policy maps account targets to warnings", () => {
  assert.equal(toTrustSafetyActionTargetType("creator"), "CREATOR")
  assert.equal(toTrustSafetyActionTargetType("unknown"), "USER")
  assert.equal(
    toTrustSafetyActionType({
      decision: "rejected",
      targetType: "creator",
    }),
    "WARN_USER"
  )
  assert.equal(
    toTrustSafetyActionType({
      decision: "needs_review",
      targetType: "user",
    }),
    "WARN_USER"
  )
})

test("critical moderation action policy does not issue actions for approved decisions", () => {
  assert.equal(
    toTrustSafetyActionType({
      decision: "approved",
      targetType: "post",
    }),
    null
  )
})
