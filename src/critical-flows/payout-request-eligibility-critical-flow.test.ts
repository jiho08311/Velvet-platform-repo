import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import {
  assertPayoutRequestEligibility,
  resolvePayoutRequestEligibility,
} from "@/modules/payout/public/payout-policy-contracts"

const PAYOUT_ALLOCATION_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/payout/runtime/execute-payout-request-allocation.ts"
)
const PAYOUT_ACCOUNT_READINESS_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/payout/runtime/get-payout-account-readiness.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

function indexAfter(source: string, pattern: string, from = 0): number {
  const index = source.indexOf(pattern, from)
  assert.ok(index > -1, `Expected to find ${pattern}`)
  return index
}

test("critical payout request eligibility rejects invalid amount, missing account, and insufficient balance", () => {
  assert.deepEqual(
    resolvePayoutRequestEligibility({
      accountReadinessState: "ready",
      requestedAmount: 0,
      availableBalance: 10000,
    }),
    {
      state: "invalid_amount",
      isEligible: false,
    }
  )

  assert.deepEqual(
    resolvePayoutRequestEligibility({
      accountReadinessState: "missing",
      requestedAmount: 10000,
      availableBalance: 10000,
    }),
    {
      state: "account_required",
      isEligible: false,
    }
  )

  assert.deepEqual(
    resolvePayoutRequestEligibility({
      accountReadinessState: "ready",
      requestedAmount: 10001,
      availableBalance: 10000,
    }),
    {
      state: "insufficient_balance",
      isEligible: false,
    }
  )
})

test("critical payout request eligibility allows only ready account with covered requestable balance", () => {
  assert.deepEqual(
    resolvePayoutRequestEligibility({
      accountReadinessState: "ready",
      requestedAmount: 10000,
      availableBalance: 10000,
    }),
    {
      state: "eligible",
      isEligible: true,
    }
  )
})

test("critical payout request eligibility throws stable operational errors", () => {
  assert.throws(
    () =>
      assertPayoutRequestEligibility({
        accountReadinessState: "ready",
        requestedAmount: -1,
        availableBalance: 10000,
      }),
    /PAYOUT_REQUEST_AMOUNT_INVALID/
  )

  assert.throws(
    () =>
      assertPayoutRequestEligibility({
        accountReadinessState: "missing",
        requestedAmount: 10000,
        availableBalance: 10000,
      }),
    /PAYOUT_ACCOUNT_NOT_READY/
  )

  assert.throws(
    () =>
      assertPayoutRequestEligibility({
        accountReadinessState: "ready",
        requestedAmount: 10001,
        availableBalance: 10000,
      }),
    /INSUFFICIENT_AVAILABLE_BALANCE/
  )
})

test("critical payout request allocation checks eligibility before inserting and locking", () => {
  const source = read(PAYOUT_ALLOCATION_RUNTIME_PATH)

  const requestableEarnings = indexAfter(
    source,
    "const requestableEarnings = filterRequestableEarnings"
  )
  const requestableAmount = indexAfter(
    source,
    "const requestableAmount = ledgerBalanceTotals.requestableAmount",
    requestableEarnings
  )
  const eligibility = indexAfter(
    source,
    "assertPayoutRequestEligibility",
    requestableAmount
  )
  const exactAmountGuard = indexAfter(
    source,
    "PAYOUT_REQUEST_AMOUNT_MUST_MATCH_AVAILABLE_BALANCE",
    eligibility
  )
  const selectedEarningIds = indexAfter(
    source,
    "const selectedEarningIds = requestableEarnings.map",
    exactAmountGuard
  )
  const insert = indexAfter(source, "await insertPayoutRequestRow", selectedEarningIds)
  const ledgerHold = indexAfter(source, "await createPayoutRequestLedgerHold", insert)
  const lock = indexAfter(source, "await lockEarningRowsForPayoutRequest", ledgerHold)

  assert.ok(requestableAmount > requestableEarnings)
  assert.ok(eligibility > requestableAmount)
  assert.ok(exactAmountGuard > eligibility)
  assert.ok(selectedEarningIds > exactAmountGuard)
  assert.ok(insert > selectedEarningIds)
  assert.ok(ledgerHold > insert)
  assert.ok(lock > ledgerHold)
})

test("critical payout account readiness requires complete bank account fields", () => {
  const source = read(PAYOUT_ACCOUNT_READINESS_RUNTIME_PATH)

  assert.match(source, /bankName\?\s*\.trim\(\)/)
  assert.match(source, /accountHolderName\?\s*\.trim\(\)/)
  assert.match(source, /accountNumber\?\s*\.trim\(\)/)
  assert.match(source, /isReady \? "ready" : "missing"/)
})
