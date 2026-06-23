import { getProfileByUserId } from "@/modules/profile/public/get-profile-by-user-id"
import { getUserById } from "@/modules/user/public/get-user-by-id"

export type ProfileData = {
  id: string
  displayName: string
  username: string
  bio: string
  avatarUrl: string | null
  email: string
  joinedAt: string
  isCreator: boolean
}

function getStringValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string") return value
  }
  return null
}

function getBooleanValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "boolean") return value
  }
  return null
}

function getIsCreator(profile: Record<string, unknown> | null) {
  if (!profile) return false

  const direct = getBooleanValue(profile, ["isCreator", "is_creator"])
  if (typeof direct === "boolean") return direct

  const role = getStringValue(profile, ["role"])
  if (role === "creator") return true

  const creatorId = getStringValue(profile, ["creatorId", "creator_id"])
  if (creatorId) return true

  return false
}

function normalizeProfileData(
  profileData: unknown,
  userData: unknown
): ProfileData | null {
  const profile =
    profileData && typeof profileData === "object"
      ? (profileData as Record<string, unknown>)
      : null

  const user =
    userData && typeof userData === "object"
      ? (userData as Record<string, unknown>)
      : null

  if (!profile && !user) return null

  return {
    id:
      (profile && getStringValue(profile, ["id", "userId", "user_id"])) ||
      (user && getStringValue(user, ["id"])) ||
      "",
    displayName:
      (profile &&
        getStringValue(profile, ["displayName", "display_name", "name"])) ||
      "",
    username: (profile && getStringValue(profile, ["username"])) || "",
    bio: (profile && getStringValue(profile, ["bio"])) || "",
    avatarUrl:
      (profile && getStringValue(profile, ["avatarUrl", "avatar_url"])) || null,
    email: (user && getStringValue(user, ["email"])) || "",
    joinedAt:
      (user &&
        getStringValue(user, ["createdAt", "created_at", "joinedAt"])) ||
      new Date().toISOString(),
    isCreator: getIsCreator(profile),
  }
}

export async function loadProfileIdentity(userId: string) {
  const [profileData, userData] = await Promise.all([
    getProfileByUserId(userId),
    getUserById(userId),
  ])

  return normalizeProfileData(profileData, userData)
}
