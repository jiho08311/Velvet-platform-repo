import type { AuthResponse } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

type SignUpInput = {
  email: string;
  password: string;
};

export async function signUp({
  email,
  password,
}: SignUpInput): Promise<AuthResponse> {
  const supabase = await createSupabaseServerClient();

  return supabase.auth.signUp({
    email,
    password,
  });
}