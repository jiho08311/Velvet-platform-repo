export type ProfileUpdatedPayload = {
  eventId: string
  profileId: string
  userId: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  version: number
  occurredAt: string
}