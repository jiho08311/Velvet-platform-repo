export default function Footer() {
  return (
    <footer className="w-full border-t border-transparent bg-gradient-to-t from-[#2a0f1c] to-transparent text-sm text-zinc-500">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 md:px-6">
        <p className="text-zinc-400">Velvet</p>

        {/* 사업자 정보 */}
        <div className="flex flex-col gap-1 text-xs text-zinc-500">
          <p>사업자등록번호: 113-25-65942</p>
          <p>대표자: 양지호</p>
          <p>
            사업장 주소: 경기도 성남시 분당구 판교로711번길 14, 402-S93호
            (야탑동, 판교 직영점)
          </p>
          <p>유선번호: +82 10-8854-6156</p>
        </div>

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