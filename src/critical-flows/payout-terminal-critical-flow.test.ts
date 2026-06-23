import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const ORCHESTRATOR_PATH = join(
  process.cwd(),
  "src/modules/payout/runtime/execute-payout-terminal.ts"
)
const PAID_PATH = join(
  process.cwd(),
  "src/modules/payout/runtime/execute-payout-terminal-paid.ts"
)
const FAILED_PATH = join(
  process.cwd(),
  "src/modules/payout/runtime/execute-payout-terminal-failed.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

function indexAfter(source: string, pattern: string, from = 0): number {
  const index = source.indexOf(pattern, from)
  assert.ok(index > -1, `Expected to find ${pattern}`)
  return index
}

test("critical payout terminal orchestrator validates lifecycle before dispatch", () => {
  const source = read(ORCHESTRATOR_PATH)

  const load = indexAfter(source, "await findPayoutTerminalRowOrThrow")
  const sendable = indexAfter(source, "assertPayoutSendable", load)
  const failable = indexAfter(source, "assertPayoutFailable", sendable)
  const linked = indexAfter(
    source,
    "await listLinkedRequestedEarningRowsByPayoutId",
    failable
  )
  const paidDispatch = indexAfter(source, "return executePayoutTerminalPaid", linked)
  const failedDispatch = indexAfter(
    source,
    "return executePayoutTerminalFailed",
    paidDispatch
  )

  assert.ok(sendable > load)
  assert.ok(failable > sendable)
  assert.ok(linked > failable)
  assert.ok(paidDispatch > linked)
  assert.ok(failedDispatch > paidDispatch)
})

test("critical payout paid path closes payout, ledger, earnings, postcondition, traceability, audit", () => {
  const source = read(PAID_PATH)

  const markPaid = indexAfter(source, "await markPayoutRowAsPaid")
  const ledger = indexAfter(source, "await createPayoutPaidLedgerTransaction", markPaid)
  const earnings = indexAfter(source, "await markEarningRowsAsPaidOutForPayout", ledger)
  const compensation = indexAfter(
    source,
    "await compensateAndShadowPayoutTerminalRowState",
    earnings
  )
  const mismatch = indexAfter(
    source,
    "FAILED_TO_CLOSE_ALL_LINKED_EARNINGS_AS_PAID_OUT",
    compensation
  )
  const postcondition = indexAfter(
    source,
    "await verifyPaidPayoutExecutionPostcondition",
    mismatch
  )
  const provenance = indexAfter(
    source,
    "await synchronizePayoutTerminalProvenanceNoThrow",
    postcondition
  )
  const topology = indexAfter(
    source,
    "await synchronizePayoutEventTopologyNoThrow",
    provenance
  )
  const audit = indexAfter(source, "await createAuditLog", topology)
  const returned = indexAfter(source, "return {", audit)

  assert.ok(ledger > markPaid)
  assert.ok(earnings > ledger)
  assert.ok(compensation > earnings)
  assert.ok(mismatch > compensation)
  assert.ok(postcondition > mismatch)
  assert.ok(provenance > postcondition)
  assert.ok(topology > provenance)
  assert.ok(audit > topology)
  assert.ok(returned > audit)
})

test("critical payout failed path fails payout, releases earnings, verifies, traces, audits", () => {
  const source = read(FAILED_PATH)

  const markFailed = indexAfter(source, "await markPayoutRowAsFailed")
  const release = indexAfter(source, "await releaseEarningRowsForFailedPayout", markFailed)
  const compensation = indexAfter(
    source,
    "await compensateAndShadowPayoutTerminalRowState",
    release
  )
  const mismatch = indexAfter(
    source,
    "FAILED_TO_RELEASE_ALL_LINKED_EARNINGS",
    compensation
  )
  const postcondition = indexAfter(
    source,
    "await verifyFailedPayoutExecutionPostcondition",
    mismatch
  )
  const provenance = indexAfter(
    source,
    "await synchronizePayoutTerminalProvenanceNoThrow",
    postcondition
  )
  const topology = indexAfter(
    source,
    "await synchronizePayoutEventTopologyNoThrow",
    provenance
  )
  const audit = indexAfter(source, "await createAuditLog", topology)
  const returned = indexAfter(source, "return {", audit)

  assert.ok(release > markFailed)
  assert.ok(compensation > release)
  assert.ok(mismatch > compensation)
  assert.ok(postcondition > mismatch)
  assert.ok(provenance > postcondition)
  assert.ok(topology > provenance)
  assert.ok(audit > topology)
  assert.ok(returned > audit)
})
