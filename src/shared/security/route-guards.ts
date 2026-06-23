import type { NextRequest } from "next/server"

function hasBearerSecret(request: Request, secret: string): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`
}

export function requireCronSecret(request: NextRequest | Request): void {
  const secret = process.env.CRON_SECRET

  if (!secret || !hasBearerSecret(request, secret)) {
    throw new Error("UNAUTHORIZED_CRON_REQUEST")
  }
}

export function requireInternalJobSecret(request: Request): void {
  const secret = process.env.INTERNAL_JOB_SECRET

  if (!secret || !hasBearerSecret(request, secret)) {
    throw new Error("UNAUTHORIZED_INTERNAL_JOB_REQUEST")
  }
}

export function isRouteGuardError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === "UNAUTHORIZED_CRON_REQUEST" ||
      error.message === "UNAUTHORIZED_INTERNAL_JOB_REQUEST")
  )
}
