export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-zinc-950 text-sm text-zinc-500">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 md:px-6">
        <p className="text-zinc-400">Velvet</p>

        <p>
          Contact:{" "}
          <a
            href="mailto:platvelvet@gmail.com"
            className="text-zinc-300 transition hover:text-white"
          >
            platvelvet@gmail.com
          </a>
        </p>

        <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
          <a href="/terms" className="transition hover:text-white">
            이용약관
          </a>
          <a href="/privacy" className="transition hover:text-white">
            개인정보 처리방침
          </a>
          <a href="/policy" className="transition hover:text-white">
            운영정책
          </a>
          <a href="/youth" className="transition hover:text-white">
            청소년 보호정책
          </a>
        </div>
      </div>
    </footer>
  )
}