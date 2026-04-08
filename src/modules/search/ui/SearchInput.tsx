"use client"

type SearchInputProps = {
  defaultValue?: string
}

export function SearchInput({ defaultValue }: SearchInputProps) {
  return (
    <input
      type="text"
      name="q"
      defaultValue={defaultValue}
      placeholder="Search creators"
      className="h-12 w-full rounded-full bg-zinc-900 px-5 text-sm text-white outline-none placeholder:text-zinc-500"
    />
  )
}