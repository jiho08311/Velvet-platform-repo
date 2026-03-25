import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { requireUser } from "@/modules/auth/server/require-user"
import { deactivateAccount } from "@/modules/user/server/deactivate-account"

export async function POST(request: Request) {
  const user = await requireUser()

  await deactivateAccount(user.id)

  const cookieStore = await cookies()
  const response = NextResponse.redirect(new URL("/sign-in", request.url), {
    status: 303,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.signOut()

  return response
}