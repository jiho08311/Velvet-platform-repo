import assert from "node:assert/strict"
import test from "node:test"

import {
  canPaymentUnlockAccess,
  getPaymentResultPageState,
  isSuccessfulPaymentStatus,
  isTerminalFailedPaymentStatus,
} from "@/modules/payment/public/payment-policy-contracts"

test("critical payment status policy unlocks access only after succeeded payments", () => {
  assert.equal(isSuccessfulPaymentStatus("succeeded"), true)
  assert.equal(isSuccessfulPaymentStatus("pending"), false)
  assert.equal(isSuccessfulPaymentStatus("failed"), false)
  assert.equal(isSuccessfulPaymentStatus("refunded"), false)

  assert.equal(canPaymentUnlockAccess("succeeded"), true)
  assert.equal(canPaymentUnlockAccess("pending"), false)
  assert.equal(canPaymentUnlockAccess("failed"), false)
  assert.equal(canPaymentUnlockAccess("refunded"), false)
})

test("critical payment status policy treats failed and refunded as terminal failures", () => {
  assert.equal(isTerminalFailedPaymentStatus("failed"), true)
  assert.equal(isTerminalFailedPaymentStatus("refunded"), true)
  assert.equal(isTerminalFailedPaymentStatus("pending"), false)
  assert.equal(isTerminalFailedPaymentStatus("succeeded"), false)
})

test("critical payment result page state allows unlock only on success reason", () => {
  assert.equal(getPaymentResultPageState("success").reason, "success")
  assert.equal(getPaymentResultPageState("success").canUnlockAccess, true)

  for (const reason of [
    "canceled",
    "failed",
    "invalid_request",
    "verification_failed",
  ] as const) {
    const state = getPaymentResultPageState(reason)

    assert.equal(state.reason, reason)
    assert.equal(state.canUnlockAccess, false)
  }
})

test("critical payment result page state fails closed for unknown reasons", () => {
  const state = getPaymentResultPageState("unknown")

  assert.equal(state.reason, "failed")
  assert.equal(state.canUnlockAccess, false)
})
