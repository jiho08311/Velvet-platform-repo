export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white">
      <h1 className="text-2xl font-semibold mb-6">개인정보처리방침</h1>

      <section className="space-y-4 text-sm text-zinc-300">
        <p>
          <strong>1. 수집 항목</strong><br />
          이메일, 휴대폰 번호, 결제 정보
        </p>

        <p>
          <strong>2. 수집 목적</strong><br />
          회원 관리, 결제 처리, 고객 문의 대응
        </p>

        <p>
          <strong>3. 보관 기간</strong><br />
          회원 탈퇴 시까지 보관하며, 법령에 따라 보관될 수 있습니다.
        </p>

        <p>
          <strong>4. 제3자 제공</strong><br />
          결제 처리를 위해 PG사에 제공될 수 있습니다.
        </p>

        <p>
          <strong>5. 보호 조치</strong><br />
          보안 시스템을 통해 개인정보를 보호합니다.
        </p>

        <p>
          <strong>6. 문의</strong><br />
          이메일: platvelvet@gmail.com
        </p>
      </section>
    </main>
  )
}