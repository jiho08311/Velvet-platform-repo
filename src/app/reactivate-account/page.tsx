import { redirect } from "next/navigation"

import { requireSession } from "@/modules/auth/public/require-session"
import { signOut } from "@/modules/auth/public/sign-out"
import { readAccountLifecycleState } from "@/modules/identity/public/account-lifecycle"
import { markExpiredDeletePendingAccountAsDeleted } from "@/modules/identity/public/account-expiration"

export default async function ReactivateAccountPage() {
  const session = await requireSession()

  const lifecycle = await readAccountLifecycleState({
    profileId: session.userId,
  })

  if (lifecycle.state === "deleted") {
    await signOut()
    redirect("/account-unavailable")
  }

  const now = new Date()
  const isDeleteExpired =
    lifecycle.isDeletePending &&
    lifecycle.deleteScheduledFor &&
    new Date(lifecycle.deleteScheduledFor).getTime() <= now.getTime()

  if (isDeleteExpired) {
    const deletedAt = now.toISOString()

 await markExpiredDeletePendingAccountAsDeleted({
  profileId: session.userId,
  deletedAt,
})

    await signOut()
    redirect("/account-unavailable")
  }

  if (!lifecycle.isDeactivated && !lifecycle.isDeletePending) {
    redirect("/settings")
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-4 py-10">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 text-white">
        <h1 className="text-2xl font-semibold">Account deactivated</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Your account is currently deactivated. Reactivate your account to continue using the platform.
        </p>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-sm text-zinc-300">Signed in as</p>
          <p className="mt-1 text-sm font-medium text-white">
       {session.userId}
          </p>
        </div>

        <form action="/api/account/reactivate" method="post" className="mt-6">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-pink-600 px-5 text-sm font-medium text-white transition hover:bg-pink-500 active:bg-pink-700"
          >
            Reactivate account
          </button>
        </form>
      </section>
    </main>
  )
}
