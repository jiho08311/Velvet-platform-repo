import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/server/assert-pass-verified"
import {
  buildPathWithNext,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff"

export default async function VerifyPassRequiredPage() {
  const nextPath = "/verifiy-pass-required"
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
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect(getPassVerificationRedirectPath({ next: nextPath }))
  }

  return (
    <div className="p-6 text-white">
      PASS verified users only
    </div>
  )
}
