export type IdentityDomainEvent =
  | {
      type: "ProfileLifecycleTransitioned"
      profileId: string
      occurredAt: string
    }
  | {
      type: "CreatorAuthorityCreated"
      profileId: string
      creatorId: string
      occurredAt: string
    }
  | {
      type: "CreatorLifecycleTransitioned"
      creatorId: string
      occurredAt: string
    }