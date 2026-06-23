// src/modules/auth/runtime/read-active-user-state.ts
export {
  readActiveIdentityState as readActiveUserState,
} from "@/modules/identity/public/onboarding-readiness"

export type {
  ActiveIdentityBlockReason as ActiveUserBlockReason,
} from "@/modules/identity/public/onboarding-readiness"