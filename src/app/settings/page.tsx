import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { getProfileByUserId } from "@/modules/profile/server/get-profile-by-user-id"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ProfileView = {
  displayName?: string | null
  bio?: string | null
  avatarUrl?: string | null
  username?: string | null
} | null

type AdminRoleAssignmentRow = {
  role: "super_admin" | "moderator" | "analytics_viewer"
}

export default async function SettingsPage() {
  const user = await requireActiveUser()
  const profileResult = await getProfileByUserId(user.id)
  const profile = profileResult as ProfileView

  const { data: adminRoles, error: adminRolesError } = await supabaseAdmin
    .from("admin_role_assignments")
    .select("role")
    .eq("profile_id", user.id)
    .returns<AdminRoleAssignmentRow[]>()

  if (adminRolesError) {
    throw adminRolesError
  }

  const isSuperAdmin = (adminRoles ?? []).some(
    (assignment) => assignment.role === "super_admin"
  )

  const username =
    profile?.username ??
    (user.email ? user.email.split("@")[0] : "user")

  const displayName = profile?.displayName ?? ""
  const bio = profile?.bio ?? ""
  const avatarFallback = (displayName || username).slice(0, 1).toUpperCase()

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-white/60">
          Manage your account and profile information.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <form
          action="/api/settings/profile"
          method="post"
          className="flex flex-col gap-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/80">Email</label>
              <input
                value={user.email ?? ""}
                disabled
                className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white/60 outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/80">Username</label>
              <input
                value={username}
                disabled
                className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white/60 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">Display name</label>
            <input
              name="displayName"
              defaultValue={displayName}
              placeholder="Enter display name"
              className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">Bio</label>
            <textarea
              name="bio"
              rows={5}
              defaultValue={bio}
              placeholder="Write a short bio"
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">Avatar</label>
            <div className="rounded-2xl border border-dashed border-white/10 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/80">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={displayName || username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarFallback
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm text-white/70">Avatar upload placeholder</p>
                  <p className="mt-1 text-xs text-white/40">
                    Replace or upload a new profile image.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Save changes
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-red-400/20 bg-neutral-950 p-6 text-white">
        <h2 className="text-lg font-semibold text-red-300">Danger zone</h2>
        <p className="mt-2 text-sm text-white/60">
          Permanently delete or deactivate your account.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {!isSuperAdmin ? (
            <form action="/api/settings/deactivate" method="post">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5"
              >
                Deactivate account
              </button>
            </form>
          ) : (
            <div className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-white/40">
              Super admin accounts cannot be deactivated here
            </div>
          )}

          <form action="/api/settings/delete-account" method="post">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-400/20 px-4 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
            >
              Delete account
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}