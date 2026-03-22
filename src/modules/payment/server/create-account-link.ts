import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type CreateAccountLinkParams = {
  creatorId: string
}

type CreatorRow = {
  id: string
}

export type AccountLink = {
  url: string
}

export async function createAccountLink({
  creatorId,
}: CreateAccountLinkParams): Promise<AccountLink> {
  const supabase = await createSupabaseServerClient()

  const { data: creator, error } = await supabase
    .from("creators")
    .select("id")
    .eq("id", creatorId)
    .maybeSingle<CreatorRow>()

  if (error) {
    throw error
  }

  if (!creator) {
    throw new Error("Creator not found")
  }

  return {
    url: "",
  }
}