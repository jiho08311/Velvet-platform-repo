import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const RUNTIME_PATH = join(
  process.cwd(),
  "src/modules/story/runtime/get-stories.ts"
)
const ITEM_PATH = join(
  process.cwd(),
  "src/modules/story/runtime/get-stories-item.ts"
)

function read(path: string): string {
  return readFileSync(path, "utf8")
}

function indexAfter(source: string, pattern: string, from = 0): number {
  const index = source.indexOf(pattern, from)
  assert.ok(index > -1, `Expected to find ${pattern}`)
  return index
}

test("critical story read filters eligibility before media lookup and item assembly", () => {
  const source = read(RUNTIME_PATH)

  const activeRows = indexAfter(source, "await listActiveStoryRows")
  const resolve = indexAfter(source, "resolveStoryRow", activeRows)
  const eligibility = indexAfter(source, "getStorySurfaceEligibility", resolve)
  const compare = indexAfter(source, "await compareStoryMediaRead", eligibility)
  const media = indexAfter(source, "await listStoryMedia", compare)
  const item = indexAfter(source, "buildStorySurfaceItem", media)

  assert.ok(resolve > activeRows)
  assert.ok(eligibility > resolve)
  assert.ok(compare > eligibility)
  assert.ok(media > compare)
  assert.ok(item > media)
})

test("critical story access only signs media URLs for unlocked stories", () => {
  const source = read(ITEM_PATH)

  const subscriptionCheck = indexAfter(source, "await canAccessCreator")
  const accessState = indexAfter(source, "const accessState = getStoryAccessState")
  const unlockedGuard = indexAfter(source, 'accessState === "visible_unlocked"', accessState)
  const signedUrl = indexAfter(source, "await serveMediaUrl", unlockedGuard)
  const lockedFallback = indexAfter(source, ': ""', signedUrl)
  const surface = indexAfter(source, "return toStorySurfaceItem", lockedFallback)

  assert.ok(subscriptionCheck > -1)
  assert.ok(unlockedGuard > accessState)
  assert.ok(signedUrl > unlockedGuard)
  assert.ok(lockedFallback > signedUrl)
  assert.ok(surface > lockedFallback)
})
