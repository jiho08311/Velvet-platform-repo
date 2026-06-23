import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const SERVICE_PATH = join(
  process.cwd(),
  "src/modules/payment/services/payment-confirmation-service.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

function indexAfter(source: string, pattern: string, from = 0): number {
  const index = source.indexOf(pattern, from)
  assert.ok(index > -1, `Expected to find ${pattern}`)
  return index
}

test("critical payment confirmation preserves execution, traceability, audit, and fanout order", () => {
  const service = read(SERVICE_PATH)

  const execution = indexAfter(service, "await executePaymentConfirmation")
  const nullReturn = indexAfter(service, "if (!execution) return null", execution)
  const paymentTrace = indexAfter(
    service,
    "await synchronizePaymentConfirmationTraceability",
    nullReturn
  )
  const providerTrace = indexAfter(
    service,
    "await synchronizeProviderCorrelationTraceability",
    paymentTrace
  )
  const reconstructionTrace = indexAfter(
    service,
    "await synchronizePaymentEventReconstruction",
    providerTrace
  )
  const duplicateGuard = indexAfter(
    service,
    "if (!duplicateDetected)",
    reconstructionTrace
  )
  const audit = indexAfter(service, "await createAuditLog", duplicateGuard)
  const fanout = indexAfter(
    service,
    "await runPostConfirmationSideEffects",
    audit
  )
  const returned = indexAfter(service, "return toConfirmedPayment", fanout)

  assert.ok(nullReturn > execution)
  assert.ok(paymentTrace > nullReturn)
  assert.ok(providerTrace > paymentTrace)
  assert.ok(reconstructionTrace > providerTrace)
  assert.ok(duplicateGuard > reconstructionTrace)
  assert.ok(audit > duplicateGuard)
  assert.ok(fanout > audit)
  assert.ok(returned > fanout)
})

test("critical payment confirmation keeps side effects behind authoritative execution", () => {
  const service = read(SERVICE_PATH)

  assert.match(service, /executePaymentConfirmation/)
  assert.match(service, /synchronizePaymentConfirmationTraceabilityNoThrow/)
  assert.match(service, /synchronizeProviderCorrelationTraceabilityNoThrow/)
  assert.match(service, /synchronizePaymentEventReconstructionNoThrow/)
  assert.match(service, /runPostConfirmationSideEffects/)
  assert.doesNotMatch(service, /runPostConfirmationSideEffects\(payment\)[\s\S]*executePaymentConfirmation/)
})

test("critical duplicate payment confirmation skips audit but still fans out and returns", () => {
  const service = read(SERVICE_PATH)

  const duplicate = indexAfter(service, "duplicateDetected")
  const existingSucceededTrace = indexAfter(
    service,
    '"confirmPaymentService.existingSucceeded"',
    duplicate
  )
  const auditGuard = indexAfter(service, "if (!duplicateDetected)", existingSucceededTrace)
  const audit = indexAfter(service, "await createAuditLog", auditGuard)
  const fanout = indexAfter(service, "await runPostConfirmationSideEffects", audit)
  const returned = indexAfter(service, "return toConfirmedPayment", fanout)

  const guardedAuditBlock = service.slice(auditGuard, fanout)

  assert.match(guardedAuditBlock, /await createAuditLog/)
  assert.doesNotMatch(guardedAuditBlock, /await runPostConfirmationSideEffects/)
  assert.ok(audit > auditGuard)
  assert.ok(fanout > audit)
  assert.ok(returned > fanout)
})
