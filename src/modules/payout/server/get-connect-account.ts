import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type GetConnectAccountParams = {
  creatorId: string
}

type CreatorRow = {
  id: string
}

export type ConnectAccount = {
  accountId: null
  chargesEnabled: false
  payoutsEnabled: false
}

export async function getConnectAccount({
  creatorId,
}: GetConnectAccountParams): Promise<ConnectAccount | null> {
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
    return null
  }

  return null
}