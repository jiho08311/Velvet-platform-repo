import Link from "next/link"
import { getUserById } from "@/modules/user/server/get-user-by-id"

type AdminUserDetailPageProps = {
  params: Promise<{
    userId: string
  }>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { userId } = await params
  const user = await getUserById(userId)

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <Link
            href="/admin/users"
            className="inline-flex w-fit items-center rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            ← Back to users
          </Link>

          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h1 className="text-2xl font-semibold text-white">User not found</h1>
            <p className="mt-3 text-sm text-zinc-400">
              This user detail is not available.
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/admin/users"
            className="inline-flex items-center rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            ← Back
          </Link>

          <div className="flex gap-3">
            <button
              type="button"
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              Unban
            </button>
            <button
              type="button"
              className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
            >
              Ban
            </button>
          </div>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            User detail
          </h1>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Email
              </p>
              <p className="mt-3 text-sm text-zinc-200">{user.email}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Username
              </p>
              <p className="mt-3 text-sm text-zinc-200">@{user.username}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Role
              </p>
              <p className="mt-3 text-sm capitalize text-zinc-200">{user.role}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Status
              </p>
              <p className="mt-3 text-sm capitalize text-zinc-200">
                {user.status}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 md:col-span-2">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Created at
              </p>
              <p className="mt-3 text-sm text-zinc-200">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Activity
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Report history or activity
          </h2>

          <div className="mt-6 flex h-56 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 text-sm text-zinc-500">
            Activity placeholder
          </div>
        </section>
      </div>
    </main>
  )
}