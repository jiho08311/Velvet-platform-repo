import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const ROUTES = {
  postCreate: "src/app/api/post/create/route.ts",
  mediaUpload: "src/app/api/media/upload/route.ts",
  legacyUploadMedia: "src/app/api/upload/media/route.ts",
  messageSend: "src/app/api/messages/[conversationId]/send/route.ts",
  payoutRequest: "src/app/api/payout/request/route.ts",
  paymentCheckout: "src/app/api/payment/checkout/route.ts",
  paymentConfirm: "src/app/api/payment/confirm/route.ts",
  ppvPostPayment: "src/app/api/payment/ppv-post/route.ts",
  storyRead: "src/app/api/story-read/route.ts",
  adminUsers: "src/app/api/admin/users/route.ts",
  adminPayoutSend: "src/app/api/admin/payout/send/route.ts",
  cronPayoutRun: "src/app/api/cron/payout/run/route.ts",
  cronOutboxProcess: "src/app/api/cron/outbox/process/route.ts",
  internalMessageOutbox: "src/app/api/internal/message-outbox/process/route.ts",
  messagePurchase: "src/app/api/message/purchase/route.ts",
} as const

function read(route: keyof typeof ROUTES): string {
  return readFileSync(join(process.cwd(), ROUTES[route]), "utf8")
}

function indexAfter(source: string, pattern: string, from = 0): number {
  const index = source.indexOf(pattern, from)
  assert.ok(index > -1, `Expected to find ${pattern}`)
  return index
}

function assertGuardBefore(source: string, guard: string, downstream: string) {
  const guardIndex = indexAfter(source, guard)
  const downstreamIndex = indexAfter(source, downstream, guardIndex)

  assert.ok(downstreamIndex > guardIndex)
}

test("critical user write APIs authenticate before body parsing or domain mutation", () => {
  const postCreate = read("postCreate")
  const mediaUpload = read("mediaUpload")
  const legacyUploadMedia = read("legacyUploadMedia")
  const messageSend = read("messageSend")
  const payoutRequest = read("payoutRequest")

  assertGuardBefore(postCreate, "await requireSession()", "await request.formData()")
  assertGuardBefore(postCreate, "await requireSession()", "await createPostWithMediaWorkflow")

  assertGuardBefore(mediaUpload, "await requireSession()", "await request.formData()")
  assertGuardBefore(mediaUpload, "await requireSession()", "await uploadMedia")

  assertGuardBefore(legacyUploadMedia, "await requireSession()", "req.headers.get")
  assertGuardBefore(legacyUploadMedia, "await requireSession()", "await req.formData()")

  assertGuardBefore(messageSend, "await requireSession()", "await request.json()")
  assertGuardBefore(messageSend, "await requireSession()", "await sendMessage")

  assertGuardBefore(payoutRequest, "await requireSession()", "await readPayoutRequestPayload")
  assertGuardBefore(payoutRequest, "await requireSession()", "await createPayoutRequest")
})

test("critical payment APIs authenticate before checkout, confirmation, or ppv payment mutation", () => {
  const paymentCheckout = read("paymentCheckout")
  const paymentConfirm = read("paymentConfirm")
  const ppvPostPayment = read("ppvPostPayment")

  assertGuardBefore(paymentCheckout, "await requireSession()", "await request.json()")
  assertGuardBefore(paymentCheckout, "await requireSession()", "await createCheckout")

  assertGuardBefore(paymentConfirm, "await requireSession()", "await req.json()")
  assertGuardBefore(paymentConfirm, "await requireSession()", "await confirmPayment")

  assertGuardBefore(ppvPostPayment, "await getCurrentUser()", "await request.json()")
  const unauthorized = indexAfter(ppvPostPayment, "status: 401")
  const body = indexAfter(ppvPostPayment, "await request.json()", unauthorized)
  const mutation = indexAfter(ppvPostPayment, "await createPpvPostPayment", body)

  assert.ok(body > unauthorized)
  assert.ok(mutation > body)
})

test("critical story read-state API returns unauthorized before persistence", () => {
  const source = read("storyRead")

  const user = indexAfter(source, "const user = await getCurrentUser()")
  const unauthorized = indexAfter(source, "status: 401", user)
  const markRead = indexAfter(source, "await markStoryReadState", unauthorized)

  assert.ok(unauthorized > user)
  assert.ok(markRead > unauthorized)
})

test("critical admin APIs require admin authority before privileged reads or writes", () => {
  const adminUsers = read("adminUsers")
  const adminPayoutSend = read("adminPayoutSend")

  assertGuardBefore(adminUsers, "await requireAdmin()", "await listUsers()")
  assertGuardBefore(adminPayoutSend, "await requireAdmin()", "await req.json()")
  assertGuardBefore(adminPayoutSend, "await requireAdmin()", "await sendPayout")
})

test("critical cron and internal APIs require bearer secrets and map guard failures to 401", () => {
  const cronPayoutRun = read("cronPayoutRun")
  const cronOutboxProcess = read("cronOutboxProcess")
  const internalMessageOutbox = read("internalMessageOutbox")

  assertGuardBefore(cronPayoutRun, "requireCronSecret(request)", "await listCronPayoutsToRun")
  assert.match(cronPayoutRun, /isRouteGuardError\(error\)/)
  assert.match(cronPayoutRun, /status: 401/)

  assertGuardBefore(cronOutboxProcess, "requireCronSecret(request)", "registerPhase5ShadowHandlers")
  assert.match(cronOutboxProcess, /isRouteGuardError\(error\)/)
  assert.match(cronOutboxProcess, /status: 401/)

  assertGuardBefore(
    internalMessageOutbox,
    "requireInternalJobSecret(request)",
    "await processMessageOutbox"
  )
  assert.match(internalMessageOutbox, /isRouteGuardError\(error\)/)
  assert.match(internalMessageOutbox, /status: 401/)
})

test("critical disabled purchase routes remain explicitly closed", () => {
  const source = read("messagePurchase")

  assert.match(source, /routeAccess = "disabled"/)
  assert.match(source, /status: 403/)
})

test("critical operational routes use structured logger instead of console errors", () => {
  const operationalRoutes: Array<keyof typeof ROUTES> = [
    "mediaUpload",
    "payoutRequest",
    "paymentConfirm",
    "adminPayoutSend",
    "cronPayoutRun",
    "cronOutboxProcess",
  ]

  for (const route of operationalRoutes) {
    const source = read(route)

    assert.doesNotMatch(source, /console\.(error|warn|log|info|debug)/, route)
    assert.match(source, /logger\.error\(/, route)
  }
})
