import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const PAYMENT_TRACEABILITY_DIR = join(
  process.cwd(),
  "src/modules/payment/traceability"
)
const PAYOUT_TRACEABILITY_DIR = join(
  process.cwd(),
  "src/modules/payout/traceability"
)
const SUBSCRIPTION_TRACEABILITY_DIR = join(
  process.cwd(),
  "src/modules/subscription/traceability"
)

const CRITICAL_OPERATIONAL_ROUTE_PATHS = [
  "src/app/auth/callback/route.ts",
  "src/app/api/auth/sign-in/route.ts",
  "src/app/api/auth/sign-up/route.ts",
  "src/app/api/auth/pass/callback/route.ts",
  "src/app/api/payment/confirm/route.ts",
  "src/app/api/payment/mock/confirm/route.ts",
  "src/app/api/payment/mock/confirm-post/route.ts",
  "src/app/api/payout/approve/route.ts",
  "src/app/api/payout/reject/route.ts",
  "src/app/api/payout/send/route.ts",
  "src/app/api/payout/request/route.ts",
  "src/app/api/admin/payout/retry/route.ts",
  "src/app/api/cron/payout/run/route.ts",
  "src/app/api/cron/outbox/process/route.ts",
  "src/app/api/cron/outbox/replay/route.ts",
  "src/app/api/cron/release-earnings/route.ts",
  "src/app/api/internal/payout/release-pending-earnings/route.ts",
  "src/app/api/creator/payouts/route.ts",
  "src/app/api/media/upload/route.ts",
  "src/app/api/admin/payout/send/route.ts",
]

const POST_RUNTIME_OBSERVABILITY_PATHS = [
  "src/modules/post/runtime/execute-post-interaction-runtime.ts",
  "src/modules/post/runtime/create-post-action.ts",
  "src/modules/post/runtime/shadow-read-post-authority-runtime.ts",
  "src/modules/post/projections/rebuild-feed-projection.ts",
]

const CLIENT_PAYMENT_OBSERVABILITY_PATHS = [
  "src/modules/payment/ui/payment-success-content.tsx",
  "src/modules/post/ui/PostPurchaseButton.tsx",
]

const PAGE_OBSERVABILITY_PATHS = [
  "src/app/search/page.tsx",
]

const SHARED_OBSERVABILITY_PATHS = [
  "src/shared/observability/async-job-trace.ts",
  "src/shared/observability/create-async-job-trace.ts",
  "src/shared/observability/financial-reconciliation-metrics.ts",
  "src/shared/observability/payout-trace.ts",
  "src/shared/observability/refund-trace.ts",
  "src/shared/observability/silent-failure-event.ts",
]

const ASYNC_WORKER_OBSERVABILITY_PATHS = [
  "src/modules/moderation/runtime/video-moderation-execution-runtime.ts",
  "src/modules/moderation/runtime/video-moderation-worker.ts",
  "src/modules/moderation/runtime/video-moderation-openai-runtime.ts",
  "src/modules/moderation/runtime/video-moderation-file-runtime.ts",
  "src/modules/moderation/runtime/video-moderation-runtime.ts",
  "src/modules/story/runtime/story-video-worker.ts",
]

const SHADOW_OBSERVABILITY_PATHS = [
  "src/modules/media/verification/verify-media-signed-url-runtime.ts",
  "src/modules/media/repositories/storage-authorization-repository.ts",
  "src/modules/media/repositories/canonical-capability-state-repository.ts",
  "src/modules/media/repositories/media-serving-authorization-repository.ts",
  "src/modules/media/repositories/media-storage-repository.ts",
  "src/modules/story/runtime/get-stories.ts",
  "src/modules/story/runtime/create-story.ts",
  "src/modules/entitlement/runtime/shadow-evaluate-access-runtime.ts",
]

const FINAL_CONSOLE_RETIREMENT_PATHS = [
  "src/modules/profile/runtime/get-adult-verification-status.ts",
  "src/modules/search/projections/rebuild-search-documents.ts",
  "src/modules/auth/runtime/sign-in-with-password.ts",
  "src/shared/ui/ErrorBoundary.tsx",
  "src/modules/feed/ui/FeedComposer.tsx",
  "src/app/profile/edit/page.tsx",
]

function walk(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []

  for (const entry of entries) {
    const path = join(dir, entry)
    const stats = statSync(path)

    if (stats.isDirectory()) {
      files.push(...walk(path))
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(path)
    }
  }

  return files
}

function read(path: string): string {
  return readFileSync(path, "utf8")
}

test("critical payment traceability fail-open paths use structured logger instead of console errors", () => {
  const files = walk(PAYMENT_TRACEABILITY_DIR)
  const runtimeFiles = files.filter((file) => !file.endsWith(".test.ts"))
  let loggerWarningCount = 0

  for (const file of runtimeFiles) {
    const source = read(file)

    assert.doesNotMatch(source, /console\.error/, file)

    if (source.includes("logger.warn(")) {
      loggerWarningCount += 1
    }
  }

  assert.equal(loggerWarningCount, 12)
})

test("critical payout traceability fail-open paths use structured logger instead of console errors", () => {
  const files = walk(PAYOUT_TRACEABILITY_DIR)
  const runtimeFiles = files.filter((file) => !file.endsWith(".test.ts"))
  let loggerWarningCount = 0

  for (const file of runtimeFiles) {
    const source = read(file)

    assert.doesNotMatch(source, /console\.error/, file)

    if (source.includes("logger.warn(")) {
      loggerWarningCount += 1
    }
  }

  assert.equal(loggerWarningCount, 18)
})

test("critical subscription traceability fail-open paths use structured logger instead of console errors", () => {
  const files = walk(SUBSCRIPTION_TRACEABILITY_DIR)
  const runtimeFiles = files.filter((file) => !file.endsWith(".test.ts"))
  let loggerWarningCount = 0

  for (const file of runtimeFiles) {
    const source = read(file)

    assert.doesNotMatch(source, /console\.error/, file)

    if (source.includes("logger.warn(")) {
      loggerWarningCount += 1
    }
  }

  assert.equal(loggerWarningCount, 17)
})

test("critical operational routes keep structured logger after console retirement", () => {
  for (const relativePath of CRITICAL_OPERATIONAL_ROUTE_PATHS) {
    const source = read(join(process.cwd(), relativePath))

    assert.doesNotMatch(source, /console\.(error|warn|log|info|debug)/, relativePath)
    assert.match(source, /logger\.error\(/, relativePath)
  }
})

test("critical post runtimes keep structured logger after console retirement", () => {
  for (const relativePath of POST_RUNTIME_OBSERVABILITY_PATHS) {
    const source = read(join(process.cwd(), relativePath))

    assert.doesNotMatch(source, /console\.(error|warn|log|info|debug)/, relativePath)
    assert.match(source, /logger\.(error|warn)\(/, relativePath)
  }
})

test("critical client payment flows use browser-safe observability instead of console errors", () => {
  for (const relativePath of CLIENT_PAYMENT_OBSERVABILITY_PATHS) {
    const source = read(join(process.cwd(), relativePath))

    assert.doesNotMatch(source, /console\.(error|warn|log|info|debug)/, relativePath)
    assert.match(source, /clientLogger\.error\(/, relativePath)
  }
})

test("critical server pages use structured logger instead of console debugging", () => {
  for (const relativePath of PAGE_OBSERVABILITY_PATHS) {
    const source = read(join(process.cwd(), relativePath))

    assert.doesNotMatch(source, /console\.(error|warn|log|info|debug)/, relativePath)
    assert.match(source, /logger\.error\(/, relativePath)
  }
})

test("critical shared observability helpers emit through structured logger", () => {
  for (const relativePath of SHARED_OBSERVABILITY_PATHS) {
    const source = read(join(process.cwd(), relativePath))

    assert.doesNotMatch(source, /console\.(error|warn|log|info|debug)/, relativePath)
    assert.match(source, /logger\.info\(/, relativePath)
  }
})

test("critical async workers use structured logger instead of console output", () => {
  for (const relativePath of ASYNC_WORKER_OBSERVABILITY_PATHS) {
    const source = read(join(process.cwd(), relativePath))

    assert.doesNotMatch(source, /console\.(error|warn|log|info|debug)/, relativePath)
    assert.match(source, /logger\.(info|error)\(/, relativePath)
  }
})

test("critical shadow access paths use structured logger instead of console warnings", () => {
  for (const relativePath of SHADOW_OBSERVABILITY_PATHS) {
    const source = read(join(process.cwd(), relativePath))

    assert.doesNotMatch(source, /console\.(error|warn|log|info|debug)/, relativePath)
    assert.match(source, /logger\.warn\(/, relativePath)
  }
})

test("critical final console retirement paths keep console output removed", () => {
  for (const relativePath of FINAL_CONSOLE_RETIREMENT_PATHS) {
    const source = read(join(process.cwd(), relativePath))

    assert.doesNotMatch(source, /console\.(error|warn|log|info|debug)/, relativePath)
  }
})
