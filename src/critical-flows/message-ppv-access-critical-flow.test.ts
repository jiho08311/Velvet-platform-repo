import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { normalizeConversationMessageItem } from "@/modules/message/types"

const SECURE_MESSAGE_MEDIA_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/message/runtime/execute-secure-message-media-runtime.ts"
)
const LIST_MESSAGES_RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/message/runtime/list-messages.ts"
)
const MESSAGE_PURCHASE_ROUTE_PATH = join(
  process.cwd(),
  "src/app/api/message/purchase/route.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

function indexAfter(source: string, pattern: string, from = 0): number {
  const index = source.indexOf(pattern, from)
  assert.ok(index > -1, `Expected to find ${pattern}`)
  return index
}

test("critical ppv message view model remains locked by default", () => {
  const message = normalizeConversationMessageItem(
    {
      id: "message_1",
      conversation_id: "conversation_1",
      sender_id: "sender_1",
      content: "paid message",
      created_at: "2026-06-22T00:00:00.000Z",
      read_at: null,
      status: "sent",
      type: "ppv",
      price: 1000,
    },
    []
  )

  assert.equal(message.type, "ppv")
  assert.equal(message.isLocked, true)
  assert.equal(message.media.length, 0)
})

test("critical text message view model is not treated as ppv locked content", () => {
  const message = normalizeConversationMessageItem(
    {
      id: "message_1",
      conversation_id: "conversation_1",
      sender_id: "sender_1",
      content: "hello",
      created_at: "2026-06-22T00:00:00.000Z",
      read_at: null,
      status: "sent",
      type: "text",
      price: null,
    },
    []
  )

  assert.equal(message.type, "text")
  assert.equal(message.isLocked, false)
})

test("critical secure ppv message media fails closed for non-sender viewers while purchase is unsupported", () => {
  const source = read(SECURE_MESSAGE_MEDIA_RUNTIME_PATH)

  const messageLookup = indexAfter(
    source,
    "await findSecureMessageMediaAccessRowByMessageId"
  )
  const conversationAccess = indexAfter(
    source,
    "await requireConversationAccess",
    messageLookup
  )
  const ppvGuard = indexAfter(
    source,
    'if (message.type === "ppv" && message.sender_id !== userId)',
    conversationAccess
  )
  const lockedDecision = indexAfter(source, "message_purchase_unsupported", ppvGuard)
  const emptyReturn = indexAfter(source, "items: []", lockedDecision)
  const mediaRows = indexAfter(
    source,
    "await getMessageMediaRowsByMessageIdOrEmpty",
    emptyReturn
  )
  const mediaMap = indexAfter(source, "await createConversationMessageMediaMap", mediaRows)
  const verify = indexAfter(source, "verifySecureMessageMediaRuntimeNoThrow", mediaMap)

  assert.ok(conversationAccess > messageLookup)
  assert.ok(ppvGuard > conversationAccess)
  assert.ok(lockedDecision > ppvGuard)
  assert.ok(emptyReturn > lockedDecision)
  assert.ok(mediaRows > emptyReturn)
  assert.ok(mediaMap > mediaRows)
  assert.ok(verify > mediaMap)
})

test("critical message list does not attach ppv media to non-sender viewers", () => {
  const source = read(LIST_MESSAGES_RUNTIME_PATH)

  const mediaRows = indexAfter(source, "await getMessageMediaRowsByMessageIds")
  const accessibleIds = indexAfter(source, "const accessibleMessageIds = new Set", mediaRows)
  const ppvSenderGuard = indexAfter(
    source,
    'message.type !== "ppv" || message.sender_id === userId',
    accessibleIds
  )
  const accessibleMediaRows = indexAfter(
    source,
    "const accessibleMediaRows = mediaRows.filter",
    ppvSenderGuard
  )
  const mediaMap = indexAfter(
    source,
    "mediaRows: accessibleMediaRows",
    accessibleMediaRows
  )
  const normalize = indexAfter(source, "normalizeConversationMessageItem", mediaMap)

  assert.ok(accessibleIds > mediaRows)
  assert.ok(ppvSenderGuard > accessibleIds)
  assert.ok(accessibleMediaRows > ppvSenderGuard)
  assert.ok(mediaMap > accessibleMediaRows)
  assert.ok(normalize > mediaMap)
})

test("critical ppv message purchase route remains disabled until unlock authority exists", () => {
  const source = read(MESSAGE_PURCHASE_ROUTE_PATH)

  assert.match(source, /routeAccess = "disabled"/)
  assert.match(source, /status: 403/)
})
