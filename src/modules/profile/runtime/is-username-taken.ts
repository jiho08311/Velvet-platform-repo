import { readProfileIdentityByUsername } from "@/modules/identity/public/read-profile-identity"

export async function isUsernameTaken(username: string) {
  const identity = await readProfileIdentityByUsername(username)

  return Boolean(identity)
}