export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-zinc-950 text-sm text-zinc-500">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 md:px-6">
        <p className="text-sm text-zinc-400">
          Velvet | 대표자 양지호 | 사업자등록번호 113-25-65942
        </p>

        <p>경기도 성남시 분당구 판교로 711번길 14</p>

        <p>
          Contact:{" "}
          <a
            href="mailto:platvelvet@gmail.com"
            className="text-zinc-300 transition hover:text-white"
          >
            platvelvet@gmail.com
          </a>
        </p>

        {/* 🔥 전화번호 추가 */}
        <p>
          Phone:{" "}
          <a
            href="tel:+821088546156"
            className="text-zinc-300 transition hover:text-white"
          >
            +82 10-8854-6156
          </a>
        </p>

        <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
          <a href="/terms" className="transition hover:text-white">
            이용약관
          </a>
          <a href="/privacy" className="transition hover:text-white">
            개인정보처리방침
          </a>
          <a href="/refund" className="transition hover:text-white">
            환불/구독 해지 정책
          </a>
        </div>
      </div>
    </footer>
  )
}