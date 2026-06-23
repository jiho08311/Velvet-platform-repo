import assert from "node:assert/strict"
import test from "node:test"

import {
  assertPayoutFailable,
  assertPayoutSendable,
  resolvePayoutExecutionLifecyclePolicy,
} from "@/modules/payout/public/payout-policy-contracts"

test("critical payout lifecycle allows pending and processing terminal execution", () => {
  assert.deepEqual(resolvePayoutExecutionLifecyclePolicy({ status: "pending" }), {
    canSend: true,
    canMarkAsFailed: true,
  })

  assert.deepEqual(
    resolvePayoutExecutionLifecyclePolicy({ status: "processing" }),
    {
      canSend: true,
      canMarkAsFailed: true,
    }
  )

  assert.doesNotThrow(() => assertPayoutSendable({ status: "pending" }))
  assert.doesNotThrow(() => assertPayoutFailable({ status: "processing" }))
})

test("critical payout lifecycle blocks already terminal payouts", () => {
  for (const status of ["paid", "failed"] as const) {
    assert.deepEqual(resolvePayoutExecutionLifecyclePolicy({ status }), {
      canSend: false,
      canMarkAsFailed: false,
    })

    assert.throws(() => assertPayoutSendable({ status }), /PAYOUT_NOT_SENDABLE/)
    assert.throws(() => assertPayoutFailable({ status }), /PAYOUT_NOT_FAILABLE/)
  }
})
