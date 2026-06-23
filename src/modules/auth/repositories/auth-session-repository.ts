import type {
  AuthResponse,
  AuthTokenResponsePassword,
  User,
} from "@supabase/supabase-js"

import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export async function getSupabaseAuthUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getSupabaseAuthSession() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getSession()

  return data.session
}

export async function signInWithPassword(input: {
  email: string
  password: string
}): Promise<AuthTokenResponsePassword> {
  const supabase = await createSupabaseServerClient()

  return supabase.auth.signInWithPassword(input)
}

export async function signUpWithPassword(input: {
  email: string
  password: string
}): Promise<AuthResponse> {
  const supabase = await createSupabaseServerClient()

  return supabase.auth.signUp(input)
}

export async function signOutCurrentSession(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
}
