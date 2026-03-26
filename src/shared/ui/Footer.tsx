export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950 text-zinc-400 text-sm">
      <div className="mx-auto max-w-5xl px-4 py-8 flex flex-col gap-3">
        <p>Velvet | 대표자 양지호 | 사업자등록번호 113-25-65942</p>
        <p>경기도 성남시 분당구 판교로 711번길 14</p>
        <p>
          Contact:{" "}
          <a
            href="mailto:platvelvet@gmail.com"
            className="hover:text-white transition"
          >
            platvelvet@gmail.com
          </a>
        </p>
        <div className="flex gap-4 text-xs">
          <a href="/terms" className="hover:text-white transition">
            이용약관
          </a>
          <a href="/privacy" className="hover:text-white transition">
            개인정보처리방침
          </a>
          <a href="/refund" className="hover:text-white transition">
            환불/구독 해지 정책
          </a>
        </div>
      </div>
    </footer>
  )
}