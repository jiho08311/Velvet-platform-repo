import { redirect } from "next/navigation"
import { readSession } from "@/modules/auth/public/read-session"
import {
  buildPathWithNext,
  SIGN_IN_PATH,
} from "@/modules/auth/utils/redirect-handoff"

export async function requireProfilePageUserId() {
  const nextPath = "/profile"
  const session = await readSession()

  if (!session?.userId) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  return session.userId
}
