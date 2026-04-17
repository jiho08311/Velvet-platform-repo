import Link from "next/link"
import { redirect } from "next/navigation"
import type { MyPostListItem } from "@/modules/post/server/get-my-posts"
import { getSession } from "@/modules/auth/server/get-session"
import { getProfileByUserId } from "@/modules/profile/server/get-profile-by-user-id"
import { getUserById } from "@/modules/user/server/get-user-by-id"
import { getMyPosts } from "@/modules/post/server/get-my-posts"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { ReportButton } from "@/modules/report/ui/ReportButton"
import { ProfileContentTabs } from "@/modules/profile/ui/ProfileContentTabs"
import { getCreatorDashboardSummary } from "@/modules/analytics/server/get-creator-dashboard-summary"
type ProfileData = {
  id: string
  displayName: string
  username: string
  bio: string
  avatarUrl: string | null
  email: string
  joinedAt: string
  isCreator: boolean
}

function getSessionUserId(session: unknown) {
  if (!session || typeof session !== "object") return null

  if ("userId" in session && typeof session.userId === "string") {
    return session.userId
  }

  if (
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof session.user.id === "string"
  ) {
    return session.user.id
  }

  return null
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
    isCreator: true,
  }
}

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const userId = getSessionUserId(session)
  if (!userId) redirect("/login")

  const creator = await getCreatorByUserId(userId)
  const creatorId = creator?.id

  const [profileData, userData, postResult, summary] = await Promise.all([
  getProfileByUserId(userId),
  getUserById(userId),
  creatorId
    ? getMyPosts({ creatorId })
    : Promise.resolve({ items: [] }),
  creatorId
    ? getCreatorDashboardSummary(creatorId)
    : Promise.resolve(null),
])

const posts = postResult.items
const profile = normalizeProfileData(profileData, userData)

const updatePosts = posts.filter(
  (post) =>
    (post.media?.length ?? 0) === 0 ||
    post.status !== "published"
)

const mediaPosts = posts.filter(
  (post) =>
    (post.media?.length ?? 0) > 0 &&
    post.status === "published"
)

  if (!profile) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h1 className="text-2xl">Profile not available</h1>
          </div>
        </div>
      </main>
    )
  }

  return (
<main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 md:px-6 md:py-8">
  <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
  
<section className="flex flex-col gap-6">
  <div className="flex items-start gap-4 md:gap-8">
    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 md:h-32 md:w-32">
      {profile.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white md:text-4xl">
          {profile.displayName.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
          <h1 className="truncate text-xl font-semibold tracking-tight text-white md:text-2xl">
            {profile.displayName}
          </h1>
          <p className="truncate text-sm text-zinc-500 md:text-base">
            @{profile.username}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 md:max-w-md">
          <div>
            <p className="text-lg font-semibold text-white md:text-xl">
              {mediaPosts.length}
            </p>
            <p className="text-sm text-zinc-500">Posts</p>
          </div>

          <div>
            <p className="text-lg font-semibold text-white md:text-xl">
              {updatePosts.length}
            </p>
            <p className="text-sm text-zinc-500">Updates</p>
          </div>

          <div>
     <p className="text-lg font-semibold text-white md:text-xl">
  {summary?.subscriberCount ?? 0}
</p>
            <p className="text-sm text-zinc-500">Subscribers</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div className="max-w-2xl">
    <p className="text-sm font-medium text-white">{profile.displayName}</p>
    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300 md:text-[15px]">
      {profile.bio || "No bio yet"}
    </p>
  </div>

  <div className="grid grid-cols-2 gap-3 md:max-w-md">
    <Link
      href="/profile/edit"
      className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-semibold text-white transition hover:border-zinc-600 hover:bg-zinc-800"
    >
      Edit profile
    </Link>

    <Link
      href={`/creator/${profile.username}`}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-semibold text-white transition hover:border-zinc-600 hover:bg-zinc-800"
    >
      View creator page
    </Link>
  </div>
</section>


{profile.isCreator && (
  <ProfileContentTabs
    mediaPosts={mediaPosts}
    updatePosts={updatePosts}
  />
)}

      </div>
    </main>
  )
}