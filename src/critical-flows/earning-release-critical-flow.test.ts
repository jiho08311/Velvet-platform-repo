import assert from "node:assert/strict"
import test from "node:test"

import {
  isPendingEarningReleaseEligible,
  normalizeEarningReleaseHoldDays,
  normalizeEarningReleaseLimit,
} from "@/modules/payout/public/payout-policy-contracts"

type PendingEarningReleaseInput = Parameters<
  typeof isPendingEarningReleaseEligible
>[0]

function earning(
  input: Partial<PendingEarningReleaseInput>
): PendingEarningReleaseInput {
  return {
    id: input.id ?? "earning-1",
    created_at: input.created_at ?? "2026-06-01T00:00:00.000Z",
    available_at: input.available_at ?? null,
  }
}

test("critical earning release clamps hold days and batch limits to operational bounds", () => {
  assert.equal(normalizeEarningReleaseHoldDays(-10), 0)
  assert.equal(normalizeEarningReleaseHoldDays(7), 7)

  assert.equal(normalizeEarningReleaseLimit(-1), 1)
  assert.equal(normalizeEarningReleaseLimit(0), 1)
  assert.equal(normalizeEarningReleaseLimit(250), 250)
  assert.equal(normalizeEarningReleaseLimit(1000), 500)
})

test("critical earning release allows explicitly available earnings regardless of age", () => {
  assert.equal(
    isPendingEarningReleaseEligible(
      earning({
        created_at: "2026-06-22T00:00:00.000Z",
        available_at: "2026-06-22T01:00:00.000Z",
      }),
      "2026-06-01T00:00:00.000Z"
    ),
    true
  )
})

test("critical earning release allows only matured pending earnings without available_at", () => {
  assert.equal(
    isPendingEarningReleaseEligible(
      earning({
        created_at: "2026-06-01T00:00:00.000Z",
        available_at: null,
      }),
      "2026-06-02T00:00:00.000Z"
    ),
    true
  )

  assert.equal(
    isPendingEarningReleaseEligible(
      earning({
        created_at: "2026-06-03T00:00:00.000Z",
        available_at: null,
      }),
      "2026-06-02T00:00:00.000Z"
    ),
    false
  )
})
