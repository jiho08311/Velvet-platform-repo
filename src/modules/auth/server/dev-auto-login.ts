import { createClient } from "@supabase/supabase-js"

type DevAutoLoginResult = {
  accessToken: string
  refreshToken: string
}

export async function devAutoLoginByPassword(email: string, password: string): Promise<DevAutoLoginResult> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("DEV_LOGIN_DISABLED")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("SUPABASE_ENV_MISSING")
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    throw new Error(error?.message ?? "FAILED_TO_SIGN_IN")
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  }
}