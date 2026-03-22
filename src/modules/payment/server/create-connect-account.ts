import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type CreateConnectAccountParams = {
  creatorId: string
}

type CreatorRow = {
  id: string
}

export type ConnectAccount = {
  creatorId: string
  accountId: null
}

export async function createConnectAccount({
  creatorId,
}: CreateConnectAccountParams): Promise<ConnectAccount> {
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
    creatorId,
    accountId: null,
  }
}