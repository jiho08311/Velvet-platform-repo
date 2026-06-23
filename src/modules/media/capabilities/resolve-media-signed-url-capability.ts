import type {
  MediaSignedUrlCapabilityDecision,
  NormalizedMediaSignedUrlInput,
} from "@/modules/media/capabilities/media-signed-url-capability-types"
import { validateMediaSignedUrlCapability } from "@/modules/media/validation/validate-media-signed-url-capability"

export async function resolveMediaSignedUrlCapability(
  input: NormalizedMediaSignedUrlInput
): Promise<MediaSignedUrlCapabilityDecision> {
  return validateMediaSignedUrlCapability(input)
}
