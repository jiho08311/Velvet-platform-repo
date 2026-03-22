import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export type AuthGuardOptions = {
  getSession?: (req: NextRequest) => Promise<{ userId: string } | null>
  loginPath?: string
}

export async function authGuard(
  req: NextRequest,
  options: AuthGuardOptions = {}
) {
  const loginPath = options.loginPath ?? "/login"

  const session = options.getSession
    ? await options.getSession(req)
    : null

  if (!session) {
    const url = new URL(loginPath, req.url)
    url.searchParams.set("redirect", req.nextUrl.pathname)

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}