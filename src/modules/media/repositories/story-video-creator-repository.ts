import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreatorIdRow = {
  id: string
}

export async function findCreatorIdByUserId(userId: string): Promise<string> {
  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("user_id", userId)
    .single<CreatorIdRow>()

  if (creatorError || !creator) {
    throw new Error("Creator not found")
  }

  return creator.id
}
