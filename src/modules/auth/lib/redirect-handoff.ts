export const DEFAULT_AUTH_RESUME_PATH = "/feed"
export const SIGN_IN_PATH = "/sign-in"
export const VERIFY_PASS_PATH = "/verify-pass"
export const ONBOARDING_PATH = "/onboarding"

type RedirectTargetParams = {
  fallback?: string
  target?: string | null
}

type PathWithNextParams = {
  path: string
  next?: string | null
}

export function normalizeRedirectTarget(target?: string | null) {
  const value = target?.trim()

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null
  }

  try {
    const url = new URL(value, "https://velvet.local")

    if (url.origin !== "https://velvet.local") {
      return null
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function resolveRedirectTarget({
  fallback = DEFAULT_AUTH_RESUME_PATH,
  target,
}: RedirectTargetParams = {}) {
  return normalizeRedirectTarget(target) ?? fallback
}

export function buildPathWithNext({ path, next }: PathWithNextParams) {
  const normalizedNext = normalizeRedirectTarget(next)

  if (!normalizedNext) {
    return path
  }

  const searchParams = new URLSearchParams({
    next: normalizedNext,
  })

  return `${path}?${searchParams.toString()}`
}
