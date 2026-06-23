import type {
  StoryCreator,
  StoryEditorState,
  StorySurfaceEligibilityInput,
} from "@/modules/story/types"

export type StoryProfileRow =
  | {
      avatar_url: string | null
      profile_lifecycle_state?: string | null
      identity_visibility_state?: string | null
      is_deactivated: boolean | null
      is_delete_pending: boolean | null
      deleted_at: string | null
      is_banned: boolean | null
    }
  | {
      avatar_url: string | null
      profile_lifecycle_state?: string | null
      identity_visibility_state?: string | null
      is_deactivated: boolean | null
      is_delete_pending: boolean | null
      deleted_at: string | null
      is_banned: boolean | null
    }[]
  | null

export type StoryCreatorRow =
  | {
      id: string
      user_id: string
      username: string
      display_name: string | null
      status: string | null
      creator_visibility_state: string | null
      profiles: StoryProfileRow
    }
  | {
      id: string
      user_id: string
      username: string
      display_name: string | null
      status: string | null
      creator_visibility_state: string | null
      profiles: StoryProfileRow
    }[]
  | null

export type StoryRow = {
  id: string
  creator_id: string
  storage_path: string
  text: string | null
  visibility: "public" | "subscribers"
  editor_state: StoryEditorState | null
  created_at: string
  expires_at: string
  is_deleted: boolean
  creators: StoryCreatorRow
}

export type ResolvedStoryRow = {
  row: StoryRow
  creatorRow:
    | {
        id: string
        user_id: string
        username: string
        display_name: string | null
        status: string | null
        creator_visibility_state: string | null
      }
    | null
  profileRow:
    | {
        avatar_url: string | null
        profile_lifecycle_state?: string | null
        identity_visibility_state?: string | null
        is_deactivated: boolean | null
        is_delete_pending: boolean | null
        deleted_at: string | null
        is_banned: boolean | null
      }
    | null
  eligibilityInput: StorySurfaceEligibilityInput
  creatorSurface: StoryCreator | null
}
