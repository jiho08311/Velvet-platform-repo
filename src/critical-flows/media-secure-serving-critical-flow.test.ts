import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { canCreateMediaSignedUrl } from "@/modules/media/public/media-policy-contracts"

const MEDIA_SIGNED_URL_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/media/runtime/execute-media-signed-url-runtime.ts"
)
const MEDIA_ISSUANCE_PATH = join(
  process.cwd(),
  "src/modules/media/issuance/issue-media-signed-url.ts"
)
const SECURE_POST_MEDIA_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/media/runtime/execute-secure-post-media-runtime.ts"
)
const POST_PROJECTION_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/post/runtime/post-projection-runtime.ts"
)
const STORY_ITEM_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/story/runtime/get-stories-item.ts"
)
const MESSAGE_MEDIA_RESOLVER_PATH = join(
  process.cwd(),
  "src/modules/media/public/resolve-message-media.ts"
)
const SECURE_MESSAGE_MEDIA_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/message/runtime/execute-secure-message-media-runtime.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

function indexAfter(source: string, pattern: string, from = 0): number {
  const index = source.indexOf(pattern, from)
  assert.ok(index > -1, `Expected to find ${pattern}`)
  return index
}

test("critical media signed url policy denies locked full-content media and permits preview-only media", () => {
  const lockedInput = {
    viewerUserId: "viewer_1",
    creatorUserId: "creator_user_1",
    visibility: "paid" as const,
    canView: false,
    isSubscribed: false,
    hasPurchased: false,
  }

  assert.equal(
    canCreateMediaSignedUrl({
      ...lockedInput,
      allowPreview: false,
    }),
    false
  )

  assert.equal(
    canCreateMediaSignedUrl({
      ...lockedInput,
      allowPreview: true,
    }),
    true
  )
})

test("critical media signed url runtime resolves capability before issuing storage signed URL", () => {
  const runtime = read(MEDIA_SIGNED_URL_RUNTIME_PATH)
  const issuance = read(MEDIA_ISSUANCE_PATH)

  const normalize = indexAfter(runtime, "const input = normalizeMediaSignedUrlInput")
  const decision = indexAfter(runtime, "await resolveMediaSignedUrlCapability", normalize)
  const issue = indexAfter(runtime, "await issueMediaSignedUrl", decision)
  const verify = indexAfter(runtime, "verifyMediaSignedUrlRuntimeNoThrow", issue)
  const contract = indexAfter(runtime, "return createMediaSignedUrlContract", verify)

  assert.ok(decision > normalize)
  assert.ok(issue > decision)
  assert.ok(verify > issue)
  assert.ok(contract > verify)

  const denyGuard = indexAfter(issuance, "if (!decision.allowed)")
  const deniedReturn = indexAfter(issuance, 'issuanceResult:', denyGuard)
  const storageSignedUrl = indexAfter(issuance, "await createMediaStorageSignedUrl", deniedReturn)

  assert.ok(deniedReturn > denyGuard)
  assert.ok(storageSignedUrl > deniedReturn)
})

test("critical secure post media returns empty before listing or signing locked post media", () => {
  const source = read(SECURE_POST_MEDIA_RUNTIME_PATH)

  const post = indexAfter(source, "const post = await getPostById")
  const lockedGuard = indexAfter(source, "if (!post || post.isLocked)", post)
  const emptyItems = indexAfter(source, "items: []", lockedGuard)
  const listMedia = indexAfter(source, "await listPostMedia", emptyItems)
  const sign = indexAfter(source, "await serveMediaUrl", listMedia)

  assert.ok(lockedGuard > post)
  assert.ok(emptyItems > lockedGuard)
  assert.ok(listMedia > emptyItems)
  assert.ok(sign > listMedia)
})

test("critical post projection signs only full-access media or selected locked preview media", () => {
  const source = read(POST_PROJECTION_RUNTIME_PATH)

  const previewPolicy = indexAfter(source, "const previewPolicy = buildLockedPreviewPolicy")
  const selectedRows = indexAfter(source, "const selectedMediaRows =", previewPolicy)
  const fullAccessBranch = indexAfter(source, "input.access.canView", selectedRows)
  const previewFilter = indexAfter(source, "previewPolicy.previewMedia.some", fullAccessBranch)
  const sign = indexAfter(source, "await serveMediaUrl", previewFilter)
  const canView = indexAfter(source, "canView: input.access.canView", sign)
  const allowPreview = indexAfter(
    source,
    "allowPreview:",
    canView
  )
  const previewSigning = indexAfter(
    source,
    "!input.access.canView && previewPolicy.allowPreviewMediaSigning",
    allowPreview
  )

  assert.ok(selectedRows > previewPolicy)
  assert.ok(fullAccessBranch > selectedRows)
  assert.ok(previewFilter > fullAccessBranch)
  assert.ok(sign > previewFilter)
  assert.ok(canView > sign)
  assert.ok(previewSigning > allowPreview)
})

test("critical story media signs only after unlocked story access state", () => {
  const source = read(STORY_ITEM_RUNTIME_PATH)

  const subscription = indexAfter(source, "await resolveStorySubscriptionAccess")
  const accessState = indexAfter(source, "const accessState = getStoryAccessState", subscription)
  const unlockedGuard = indexAfter(source, 'accessState === "visible_unlocked"', accessState)
  const sign = indexAfter(source, "await serveMediaUrl", unlockedGuard)
  const lockedFallback = indexAfter(source, ': ""', sign)

  assert.ok(accessState > subscription)
  assert.ok(unlockedGuard > accessState)
  assert.ok(sign > unlockedGuard)
  assert.ok(lockedFallback > sign)
})

test("critical message media signing stays behind secure message runtime fail-closed guard", () => {
  const secureRuntime = read(SECURE_MESSAGE_MEDIA_RUNTIME_PATH)
  const resolver = read(MESSAGE_MEDIA_RESOLVER_PATH)

  const ppvGuard = indexAfter(
    secureRuntime,
    'if (message.type === "ppv" && message.sender_id !== userId)'
  )
  const emptyReturn = indexAfter(secureRuntime, "items: []", ppvGuard)
  const mediaRows = indexAfter(
    secureRuntime,
    "await getMessageMediaRowsByMessageIdOrEmpty",
    emptyReturn
  )
  const mediaMap = indexAfter(
    secureRuntime,
    "await createConversationMessageMediaMap",
    mediaRows
  )

  assert.ok(emptyReturn > ppvGuard)
  assert.ok(mediaRows > emptyReturn)
  assert.ok(mediaMap > mediaRows)

  const capability = indexAfter(resolver, "const capability = resolveConversationMediaCapability")
  const sign = indexAfter(resolver, "await serveMediaUrl", capability)
  const kind = indexAfter(resolver, 'capabilityKind: "message_media_signed_url"', sign)

  assert.ok(sign > capability)
  assert.ok(kind > sign)
})
