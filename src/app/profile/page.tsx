import Link from "next/link"
import { redirect } from "next/navigation"
import type { MyPostListItem } from "@/modules/post/server/get-my-posts"
import { getSession } from "@/modules/auth/server/get-session"
import { getProfileByUserId } from "@/modules/profile/server/get-profile-by-user-id"
import { getUserById } from "@/modules/user/server/get-user-by-id"
import { getMyPosts } from "@/modules/post/server/get-my-posts"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { ReportButton } from "@/modules/report/ui/ReportButton"

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

  const [profileData, userData, postResult] = await Promise.all([
    getProfileByUserId(userId),
    getUserById(userId),
    creatorId
      ? getMyPosts({ creatorId })
      : Promise.resolve({ items: [] }),
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
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-zinc-800">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                    {profile.displayName.slice(0, 1).toUpperCase()}
                  </div>
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

          <div className="mt-3">
            <ReportButton
              targetType="user"
              targetId={profile.id}
              pathname="/profile"
              currentUserId={userId}
            />
          </div>
        </section>

        {profile.isCreator && posts.length > 0 && (
          <section className="grid grid-cols-3 gap-[2px] bg-zinc-900">
            {posts.map((post: MyPostListItem) => {
              const media = post.media?.[0]
              const mediaCount = post.media?.length ?? 0
              const extraMediaCount = mediaCount > 1 ? mediaCount - 1 : 0

              return (
                <a
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="relative aspect-square overflow-hidden bg-zinc-800"
                >
                  {media?.url ? (
                    media.type === "video" ? (
                      <video
                        src={media.url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={media.url}
                        alt=""
                        className="h-full w-full object-cover hover:opacity-90"
                      />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                      No media
                    </div>
                  )}

                  {extraMediaCount > 0 ? (
                    <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      +{extraMediaCount}
                    </div>
                  ) : null}
                </a>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}