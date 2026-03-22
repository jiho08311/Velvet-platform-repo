export type SearchResultType = "creator" | "post"

export type SearchResult = {
  id: string
  type: SearchResultType
  label: string
}