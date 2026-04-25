import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { buildPathWithNext } from "@/modules/auth/lib/redirect-handoff"

export type AuthGuardOptions = {
  getSession?: (req: NextRequest) => Promise<{ userId: string } | null>
  loginPath?: string
}

export async function authGuard(
  req: NextRequest,
  options: AuthGuardOptions = {}
) {
  const loginPath = options.loginPath ?? "/sign-in"

  const session = options.getSession
    ? await options.getSession(req)
    : null

  if (!session) {
    const url = new URL(
      buildPathWithNext({
        path: loginPath,
        next: `${req.nextUrl.pathname}${req.nextUrl.search}`,
      }),
      req.url
    )

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
