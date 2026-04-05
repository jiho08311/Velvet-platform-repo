type Props = {
  title: string
  content: string
}

function PolicyLayout({ title, content }: Props) {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-300">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-semibold text-white">{title}</h1>

        <div className="whitespace-pre-wrap text-sm leading-7">
          {content}
        </div>
      </div>
    </main>
  )
}

export default PolicyLayout