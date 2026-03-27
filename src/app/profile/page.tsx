import Link from "next/link"
import { redirect } from "next/navigation"
import type { MyPostListItem } from "@/modules/post/server/get-my-posts"
import { getSession } from "@/modules/auth/server/get-session"
import { getProfileByUserId } from "@/modules/profile/server/get-profile-by-user-id"
import { getUserById } from "@/modules/user/server/get-user-by-id"
import { getMyPosts } from "@/modules/post/server/get-my-posts"

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value))
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
      (profile &&
        getStringValue(profile, ["avatarUrl", "avatar_url"])) ||
      null,
    email: (user && getStringValue(user, ["email"])) || "",
    joinedAt:
      (user &&
        getStringValue(user, ["createdAt", "created_at", "joinedAt"])) ||
      new Date().toISOString(),
    isCreator: getIsCreator(profile),
  }
}

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const userId = getSessionUserId(session)
  if (!userId) redirect("/login")

  const [profileData, userData, postResult] = await Promise.all([
    getProfileByUserId(userId),
    getUserById(userId),
    getMyPosts({ creatorId: userId }),
  ])

  const posts = postResult.items
  const profile = normalizeProfileData(profileData, userData)

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
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-4xl flex flex-col gap-8">

        {/* Profile */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl">{profile.displayName}</h2>
              <p className="text-sm text-zinc-400">@{profile.username}</p>
            </div>

            {/* ✅ 항상 보이게 */}
            <Link
              href="/profile/edit"
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
            >
              Edit profile
            </Link>
          </div>

          <p className="mt-4 text-sm text-zinc-300">
            {profile.bio || "No bio yet"}
          </p>
        </section>

        {/* Posts */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-2xl text-white">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          profile.displayName.slice(0, 1).toUpperCase()
        )}
      </div>

      <div>
        <h2 className="text-2xl">{profile.displayName}</h2>
        <p className="text-sm text-zinc-400">@{profile.username}</p>
      </div>
    </div>

    <Link
      href="/profile/edit"
      className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
    >
      Edit profile
    </Link>
  </div>

  <p className="mt-4 text-sm text-zinc-300">
    {profile.bio || "No bio yet"}
  </p>
</section>

      </div>
    </main>
  )
}