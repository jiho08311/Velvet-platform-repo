import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { getAdultVerificationStatus } from "@/modules/profile/server/get-adult-verification-status"

export default async function VerifyPassPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  const verification = await getAdultVerificationStatus({
    profileId: user.id,
  })

  return (
    <div className="mx-auto max-w-md space-y-6 p-6 text-white">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Verify with PASS</h1>
        <p className="text-sm text-zinc-400">
          Complete PASS verification to access adult-only features.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <p className="text-sm font-medium text-white">Current status</p>
        <p className="mt-1 text-xs text-zinc-400">
          {verification.isAdultVerified &&
          verification.adultVerificationMethod === "pass"
            ? "PASS verification completed"
            : "PASS verification not completed"}
        </p>
      </div>

      {verification.isAdultVerified &&
      verification.adultVerificationMethod === "pass" ? (
        <a
          href="/"
          className="block w-full rounded-full bg-[#C2185B] px-4 py-3 text-center text-sm font-medium text-white hover:bg-[#D81B60]"
        >
          Continue
        </a>
      ) : (
        <a
          href={`/api/auth/pass/start?profileId=${user.id}`}
          className="block w-full rounded-full bg-[#C2185B] px-4 py-3 text-center text-sm font-medium text-white hover:bg-[#D81B60]"
        >
          Verify with PASS
        </a>
      )}
    </div>
  )
}