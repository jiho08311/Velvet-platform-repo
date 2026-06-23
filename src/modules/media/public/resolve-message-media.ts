import { resolveConversationMediaCapability } from "@/modules/media/capabilities/resolve-conversation-media-capability"
import { serveMediaUrl } from "@/modules/media/serving"

export const PUBLIC_CONTRACT = true

export type ResolveMessageMediaInput = {
  mediaId: string
  storagePath: string
  mimeType: string
  viewerUserId: string
  senderUserId: string
}

export type ResolvedMessageMedia = {
  id: string
  url: string
  type: "image" | "video"
  mimeType: string
}

function getMessageMediaType(mimeType: string): "image" | "video" {
  return mimeType.startsWith("video/") ? "video" : "image"
}

export async function resolveMessageMedia(
  input: ResolveMessageMediaInput
): Promise<ResolvedMessageMedia> {
  const capability = resolveConversationMediaCapability()

  return {
    id: input.mediaId,
    url: await serveMediaUrl({
      storagePath: input.storagePath,
      viewerUserId: input.viewerUserId,
      creatorUserId: input.senderUserId,
      visibility: capability.signedUrlInput.visibility,
      hasPurchased: capability.signedUrlInput.hasPurchased,
      mediaId: input.mediaId,
      capabilitySurface: "message_media_signing",
      capabilityKind: "message_media_signed_url",
    }),
    type: getMessageMediaType(input.mimeType),
    mimeType: input.mimeType,
  }
}
