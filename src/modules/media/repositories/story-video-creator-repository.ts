import {
  readCreatorIdentityByUserId,
} from "@/modules/identity/public/read-creator-identity"

export async function findCreatorIdByUserId(
  userId: string
): Promise<string> {
  const creator =
    await readCreatorIdentityByUserId(userId)

  if (!creator) {
    throw new Error("Creator not found")
  }

  return creator.id
}