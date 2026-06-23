export type CommerceErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "NOT_ELIGIBLE"
  | "INVALID_STATE"
  | "PROVIDER_DECLINED"
  | "PROVIDER_ERROR"
  | "SIDE_EFFECT_FAILED"
  | "INVARIANT_VIOLATION"
  | "INTERNAL_ERROR"

export class CommerceError extends Error {
  constructor(
    public readonly code: CommerceErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "CommerceError"
  }
}