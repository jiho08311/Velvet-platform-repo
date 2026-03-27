"use client"

import { useEffect, useRef } from "react"

type SearchInputProps = {
  defaultValue?: string
}

export function SearchInput({ defaultValue }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      name="q"
      defaultValue={defaultValue}
      placeholder="Search creators"
      className="h-12 w-full rounded-full bg-zinc-900 px-5 text-sm text-white outline-none placeholder:text-zinc-500"
    />
  )
}