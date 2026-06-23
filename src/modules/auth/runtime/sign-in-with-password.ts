"use client"

import { createBrowserSupabaseClient } from "@/modules/auth/utils/create-browser-supabase-client"

type SignInWithPasswordInput = {
  email: string
  password: string
}

export async function signInWithPassword({
  email,
  password,
}: SignInWithPasswordInput) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}
