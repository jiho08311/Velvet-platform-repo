import { redirect } from "next/navigation"

import {
  buildPathWithNext,
  ONBOARDING_PATH,
} from "@/modules/auth/utils/redirect-handoff"

export function redirectToFeedOnboarding(nextPath: string): never {
  redirect(
    buildPathWithNext({
      path: ONBOARDING_PATH,
      next: nextPath,
    })
  )
}
