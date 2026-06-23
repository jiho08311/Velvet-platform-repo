import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"

type CreateAccountLinkParams = {
  creatorId: string
}

export type AccountLink = {
  url: string
}

export async function createAccountLink({
  creatorId,
}: CreateAccountLinkParams): Promise<AccountLink> {
  const creator = await readCreatorIdentityByCreatorId(creatorId)

  if (!creator) {
    throw new Error("Creator not found")
  }

  return {
    url: "",
  }
}