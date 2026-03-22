type SearchResultItem = {
  id: string
  label: string
  type: "creator" | "post"
}

type SearchResultListProps = {
  results: SearchResultItem[]
  emptyMessage?: string
}

export function SearchResultList({
  results,
  emptyMessage = "No results found.",
}: SearchResultListProps) {
  if (results.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <ul className="divide-y divide-zinc-200">
        {results.map((item) => (
          <li key={item.id} className="px-4 py-3 hover:bg-zinc-50">
            <p className="text-sm font-medium text-zinc-900">
              {item.label}
            </p>
            <p className="text-xs text-zinc-500 capitalize">{item.type}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}