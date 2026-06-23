export type CreatorActivatedPayload = {
  eventId: string
  creatorId: string
  userId: string
  username: string | null
  activatedAt: string
  category: string | null
  country: string | null
  activationVersion: number
}