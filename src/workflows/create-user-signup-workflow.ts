import { signUp } from "@/modules/auth/server/sign-up"
import { createUser } from "@/modules/user/server/create-user"
import { createProfile } from "@/modules/profile/server/create-profile"

type CreateUserSignupWorkflowInput = {
  email: string
  password: string
  username: string
  displayName: string
}

export async function createUserSignupWorkflow({
  email,
  password,
  username,
  displayName,
}: CreateUserSignupWorkflowInput) {
  const authResult = await signUp({ email, password })

  if (authResult.error) {
    throw authResult.error
  }

  const authUser = authResult.data.user

  if (!authUser) {
    throw new Error("Failed to create auth user")
  }

  const user = await createUser({
    id: authUser.id,
    email: authUser.email ?? email,
    username,
  })

  const profile = await createProfile({
    userId: user.id,
    email: authUser.email ?? email,
    username,
    displayName,
  })

  return {
    auth: authResult.data,
    user,
    profile,
  }
}