export type ProfileId = string

export type AdultVerificationMethod = "self_reported" | "pass" | null

export type Profile = {
  id: ProfileId
  email: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null

  birthDate: string | null
  isAdultVerified: boolean
  adultVerifiedAt: string | null
  adultVerificationMethod: AdultVerificationMethod

  createdAt: string
}