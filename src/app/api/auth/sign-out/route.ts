import { NextResponse } from "next/server"
import { signOut } from "@/modules/auth/public/sign-out"

export const routeAccess = "public"

export async function POST() {
  await signOut()

  return NextResponse.json({ success: true })
}
