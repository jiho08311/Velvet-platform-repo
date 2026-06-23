import Link from "next/link"

import { ProfileContentTabs } from "@/modules/profile/public/profile-ui"
import { loadProfilePageData } from "./profile-page-data"
import { requireProfilePageUserId } from "./profile-page-auth"

export default async function ProfilePage() {
  const userId = await requireProfilePageUserId()
  const { mediaPosts, profile, summary, updatePosts } =
    await loadProfilePageData(userId)

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
  {summary?.counts.subscriberCount ?? 0}
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
