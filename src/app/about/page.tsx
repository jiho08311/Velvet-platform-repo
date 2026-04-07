export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold">Velvet 소개</h1>

        <section className="space-y-4 text-zinc-300">
          <p>
            Velvet은 크리에이터의 콘텐츠를 구독 형태로 이용할 수 있는 플랫폼입니다.
          </p>
          <p>
            사용자는 자신이 좋아하는 크리에이터를 구독하고, 구독자 전용 콘텐츠를 이용할 수 있습니다.
            크리에이터는 구독 기반으로 콘텐츠를 제공하며 팬들과 지속적으로 소통할 수 있습니다.
          </p>
        </section>

        <section className="space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">왜 Velvet인가</h2>
          <p>
            우리는 앞으로 사람들이 더 많은 여가 시간을 가지게 되고, 그 시간은 점점 더 콘텐츠와 개인에 집중될 것이라고 생각합니다.
          </p>
          <p>
            Velvet은 이러한 변화 속에서, 크리에이터의 콘텐츠를 구독을 통해 지속적으로 소비하는 경험을 제공합니다.
          </p>
        </section>

        <section className="space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            Velvet이 제공하는 경험
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>구독 기반 콘텐츠 이용</li>
            <li>구독자 전용 콘텐츠 제공</li>
            <li>크리에이터 중심 콘텐츠 소비 경험</li>
          </ul>
        </section>

        <section className="space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            크리에이터와 콘텐츠
          </h2>
          <p>
            Velvet은 크리에이터가 자신의 콘텐츠를 구독 형태로 제공하고,
            사용자는 구독을 통해 지속적으로 콘텐츠를 이용할 수 있는 환경을 제공합니다.
          </p>
        </section>

        <section className="space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">한 줄 정의</h2>
          <p className="font-medium text-white">
            Velvet은 크리에이터의 콘텐츠를 구독으로 이용하는 플랫폼입니다.
          </p>
        </section>
      </div>
    </main>
  )
}