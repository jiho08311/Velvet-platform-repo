import type { Story, StorySurfaceItemInput } from "../types"

export function toStorySurfaceItem(input: StorySurfaceItemInput): Story {
  const baseStory: Omit<Story, "mediaUrl" | "text" | "editorState" | "isLocked" | "lockReason"> = {
    id: input.id,
    creatorId: input.creatorId,
    mediaType: input.mediaType,
    visibility: input.visibility,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    isDeleted: input.isDeleted,
    creator: input.creator,
  }

  switch (input.accessState) {
    case "visible_unlocked":
      return {
        ...baseStory,
        mediaUrl: input.mediaUrl,
        text: input.text,
        editorState: input.editorState,
        isLocked: false,
        lockReason: "none",
      }

    case "visible_locked":
      return {
        ...baseStory,
        mediaUrl: "",
        text: null,
        editorState: null,
        isLocked: true,
        lockReason: "subscription",
      }
  }

  const unreachableAccessState: never = input.accessState

  throw new Error(`Unsupported story access state: ${unreachableAccessState}`)
}
