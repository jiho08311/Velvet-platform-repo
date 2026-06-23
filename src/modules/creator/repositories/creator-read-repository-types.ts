export type CreatorServingStatus =
  | "pending"
  | "active"
  | "suspended"
  | "banned"
  | "inactive"

export type CreatorVisibilityState = "public_candidate" | "not_public"

export type CreatorByUserIdRow = {
  id: string
  user_id: string
  username: string | null
  status: CreatorServingStatus
  creator_visibility_state?: CreatorVisibilityState | null
  subscription_price: number | null
  subscription_currency: string | null
  created_at: string
  updated_at: string
}

export type CreatorByIdRow = {
  id: string
  user_id: string
  username: string | null
  subscription_price: number | null
  subscription_currency: string | null
  status: CreatorServingStatus
  creator_visibility_state?: CreatorVisibilityState | null
  created_at: string
}

export type CreatorByUsernameRow = {
  id: string
  user_id: string
  status: CreatorServingStatus
  creator_visibility_state?: CreatorVisibilityState | null
  subscription_price: number
  subscription_currency: string
  created_at: string
  updated_at: string
  username: string
}

export type CreatorProfileByUserIdRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url?: string | null
  bio?: string | null
  is_deactivated?: boolean | null
  is_delete_pending?: boolean | null
  deleted_at?: string | null
  is_banned?: boolean | null
  profileLifecycleState?: string | null
identityVisibilityState?: string | null
}

export type CanonicalCreatorReadRow = {
  id: string
  creator_id: string | null
  user_id: string | null
  profile_id: string | null
  username: string | null
  display_name: string | null
  status: string | null
  creator_lifecycle_state: string | null
  creator_visibility_state: string | null
  aggregate_metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type CanonicalProfileReadRow = {
  profile_id: string | null
  username: string | null
  display_name: string | null
  profile_lifecycle_state: string | null
  identity_visibility_state: string | null
  aggregate_metadata: Record<string, unknown> | null
}

export type CreatorListRow = {
  id: string
  user_id: string
  username?: string | null
  status: CreatorServingStatus
  creator_visibility_state?: CreatorVisibilityState | null
  subscription_price: number
  subscription_currency: string
  created_at: string
  updated_at: string
}
