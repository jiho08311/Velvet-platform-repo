"use client"

import { createBrowserSupabaseClient } from "./create-browser-supabase-client"

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

  console.log("SIGN_IN_RESULT", { data, error })

  if (error) {
    throw error
  }

  return data
}