import type { CreateMediaSignedUrlInput } from "@/modules/media/public/create-media-signed-url"

export type ConversationMediaCapability = {
  allowed: true
  reason: "conversation_access_granted"
  signedUrlInput: Pick<
    CreateMediaSignedUrlInput,
    "visibility" | "hasPurchased"
  >
}

/**
 * Conversation media capability.
 *
 * Current behavior preservation:
 * Message media already requires conversation access before this capability is
 * resolved. The signed URL behavior is intentionally preserved as
 * visibility="paid" + hasPurchased=true until a final paid/locked message media
 * policy exists.
 */
export function resolveConversationMediaCapability(): ConversationMediaCapability {
  return {
    allowed: true,
    reason: "conversation_access_granted",
    signedUrlInput: {
      visibility: "paid",
      hasPurchased: true,
    },
  }
}