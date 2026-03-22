import type { AuthTokenResponsePassword } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

type SignInInput = {
  email: string;
  password: string;
};

export async function signIn({
  email,
  password,
}: SignInInput): Promise<AuthTokenResponsePassword> {
  const supabase = await createSupabaseServerClient();

  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}