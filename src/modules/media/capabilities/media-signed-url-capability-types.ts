export type MediaVisibility = "public" | "subscribers" | "paid"

export type Wave009CapabilityIsolationSurface = string
export type Wave009CapabilityKind = string

export type CreateMediaSignedUrlInput = {
  storagePath: string
  viewerUserId?: string | null
  creatorUserId?: string | null
  visibility: MediaVisibility
  canView?: boolean
  isSubscribed?: boolean
  hasPurchased?: boolean
  expiresIn?: number
  allowPreview?: boolean
  mediaId?: string | null
  capabilitySurface?: Wave009CapabilityIsolationSurface
  capabilityKind?: Wave009CapabilityKind
}

export type NormalizedMediaSignedUrlInput = {
  storagePath: string
  viewerUserId: string
  creatorUserId: string
  mediaId: string
  visibility: MediaVisibility
  canView?: boolean
  isSubscribed: boolean
  hasPurchased: boolean
  expiresIn: number
  allowPreview: boolean
  capabilitySurface: Wave009CapabilityIsolationSurface
  capabilityKind: Wave009CapabilityKind
}

export type MediaSignedUrlCapabilityDecisionReason =
  | "storage_path_empty"
  | "runtime_policy_allowed"
  | "runtime_policy_denied"
  | "canonical_allowed"
  | "canonical_denied"

export type MediaSignedUrlCapabilityDecision = {
  allowed: boolean
  reason: MediaSignedUrlCapabilityDecisionReason
  runtimeCanSignUrl: boolean
  canonicalCanSignUrl: boolean | null
  isOwner: boolean
  input: NormalizedMediaSignedUrlInput
}