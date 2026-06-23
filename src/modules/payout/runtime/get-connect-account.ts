import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"

type GetConnectAccountParams = {
  creatorId: string
}

export type ConnectAccount = {
  accountId: null
  chargesEnabled: false
  payoutsEnabled: false
}

export async function getConnectAccount({
  creatorId,
}: GetConnectAccountParams): Promise<ConnectAccount | null> {
  const creator = await readCreatorIdentityByCreatorId(creatorId)

  if (!creator) {
    return null
  }

  return null
}