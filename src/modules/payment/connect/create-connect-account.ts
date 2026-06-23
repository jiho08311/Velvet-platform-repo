import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"

type CreateConnectAccountParams = {
  creatorId: string
}

export type ConnectAccount = {
  creatorId: string
  accountId: null
}

export async function createConnectAccount({
  creatorId,
}: CreateConnectAccountParams): Promise<ConnectAccount> {
  const creator = await readCreatorIdentityByCreatorId(creatorId)

  if (!creator) {
    throw new Error("Creator not found")
  }

  return {
    creatorId,
    accountId: null,
  }
}