export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/infrastructure/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  redirect("/feed")
}