export class InfrastructureError extends Error {
  readonly code: string
  readonly metadata?: Record<string, unknown>

  constructor(
    code: string,
    options?: {
      cause?: unknown
      metadata?: Record<string, unknown>
    }
  ) {
    super(code, {
      cause: options?.cause,
    })

    this.name = "InfrastructureError"
    this.code = code
    this.metadata = options?.metadata
  }
}