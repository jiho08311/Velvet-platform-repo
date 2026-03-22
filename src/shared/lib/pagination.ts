export type PaginationParams = {
  limit?: number
  cursor?: string | null
  page?: number
}

export type PaginationResult = {
  limit: number
  offset: number
  cursor?: string | null
}

export function resolvePagination(
  params: PaginationParams = {}
): PaginationResult {
  const limit = Math.max(1, Math.min(params.limit ?? 20, 100))

  if (params.page && params.page > 0) {
    return {
      limit,
      offset: (params.page - 1) * limit,
    }
  }

  return {
    limit,
    offset: 0,
    cursor: params.cursor ?? null,
  }
}