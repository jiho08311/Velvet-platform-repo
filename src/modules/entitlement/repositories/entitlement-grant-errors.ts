import { InfrastructureError } from "@/shared/errors"

export function entitlementInfrastructureError(
  code: string,
  cause: unknown,
  metadata: Record<string, unknown>
): InfrastructureError {
  return new InfrastructureError(code, {
    cause,
    metadata,
  })
}
