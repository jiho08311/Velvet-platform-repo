export type IdentityActor =
  | { type: "user"; userId: string }
  | { type: "creator"; userId: string; creatorId: string }
  | { type: "admin"; userId: string; roles: string[] }
  | { type: "system"; name: string }
  | { type: "migration"; name: string }