export function assertNotSelfUserManagement(input: {
  currentAdminId: string
  targetUserId: string
  errorMessage: string
}) {
  if (input.currentAdminId === input.targetUserId) {
    throw new Error(input.errorMessage)
  }
}

export function assertNotAdminTargetUserManagement(input: {
  targetIsAdmin: boolean
  errorMessage: string
}) {
  if (input.targetIsAdmin) {
    throw new Error(input.errorMessage)
  }
}