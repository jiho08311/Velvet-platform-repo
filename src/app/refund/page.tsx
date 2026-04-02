export default function RefundPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white">
      <h1 className="text-2xl font-semibold mb-6">환불 및 이용 해지 정책</h1>

      <section className="space-y-4 text-sm text-zinc-300">
        <p>
          <strong>1. 이용권</strong><br />
          결제 즉시 서비스 이용이 시작되며, 결제 후 환불은 불가합니다.<br />
          이용 해지는 언제든 가능하며 다음 결제부터 적용됩니다.
        </p>

        <p>
          <strong>2. 프리미엄 콘텐츠</strong><br />
          디지털 콘텐츠 특성상 결제 후 환불이 불가합니다.
        </p>

        <p>
          <strong>3. 예외 환불</strong><br />
          결제 오류 및 중복 결제 시 환불 가능합니다.
        </p>

        <p>
          <strong>4. 문의</strong><br />
          이메일: platvelvet@gmail.com
        </p>
      </section>
    </main>
  )
}