import type { Story, StorySurfaceItemInput } from "../types"

export function toStorySurfaceItem(input: StorySurfaceItemInput): Story {
  const isLocked = input.accessState === "visible_locked"
  const isUnlocked = input.accessState === "visible_unlocked"

  return {
    id: input.id,
    creatorId: input.creatorId,
    mediaUrl: isUnlocked ? input.mediaUrl : "",
    mediaType: input.mediaType,
    text: isUnlocked ? input.text : null,
    visibility: input.visibility,
    editorState: isUnlocked ? input.editorState : null,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    isDeleted: input.isDeleted,
    isLocked,
    lockReason: isLocked ? "subscription" : "none",
    creator: input.creator,
  }
}