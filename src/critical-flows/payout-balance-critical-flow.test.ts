import assert from "node:assert/strict"
import test from "node:test"

import {
  filterRequestableEarnings,
  getEarningBalanceAmount,
  isRequestableEarning,
  resolvePayoutBalanceTotals,
  sumRequestableEarnings,
  type EarningBalanceRow,
} from "@/modules/payout/public/payout-policy-contracts"

const rows: EarningBalanceRow[] = [
  { status: "pending", net_amount: 100 },
  { status: "available", net_amount: 200 },
  { status: "available", net_amount: 50, payout_request_id: "request-1" },
  { status: "available", net_amount: 40, payout_id: "payout-1" },
  { status: "requested", net_amount: 300 },
  { status: "paid_out", net_amount: 400 },
  { status: "reversed", net_amount: 25 },
  { status: "available", net_amount: null },
  { status: "available", net_amount: -10 },
]

test("critical payout balance treats invalid or negative earning amounts as zero", () => {
  assert.equal(getEarningBalanceAmount({ status: "available", net_amount: null }), 0)
  assert.equal(getEarningBalanceAmount({ status: "available", net_amount: -10 }), 0)
  assert.equal(getEarningBalanceAmount({ status: "available", net_amount: 125 }), 125)
})

test("critical payout balance marks only unallocated available earnings as requestable", () => {
  assert.equal(isRequestableEarning({ status: "available", net_amount: 10 }), true)
  assert.equal(
    isRequestableEarning({
      status: "available",
      net_amount: 10,
      payout_request_id: "request-1",
    }),
    false
  )
  assert.equal(
    isRequestableEarning({
      status: "available",
      net_amount: 10,
      payout_id: "payout-1",
    }),
    false
  )
  assert.equal(isRequestableEarning({ status: "pending", net_amount: 10 }), false)
})

test("critical payout balance filters and sums only positive requestable earnings", () => {
  assert.deepEqual(filterRequestableEarnings(rows), [
    { status: "available", net_amount: 200 },
  ])
  assert.equal(sumRequestableEarnings(rows), 200)
})

test("critical payout balance totals keep available total separate from requestable total", () => {
  assert.deepEqual(resolvePayoutBalanceTotals(rows), {
    pendingAmount: 100,
    availableAmount: 290,
    requestedAmount: 300,
    paidOutAmount: 400,
    reversedAmount: 25,
    requestableAmount: 200,
  })
})
