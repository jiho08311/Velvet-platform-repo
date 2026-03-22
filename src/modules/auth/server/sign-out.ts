import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}