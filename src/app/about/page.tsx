export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold">Velvet 소개</h1>

        <section className="space-y-4 text-zinc-300">
          <p>
            Velvet은 크리에이터의 일상과 콘텐츠를 구독할 수 있는 플랫폼입니다.
          </p>
          <p>
            사용자는 자신이 좋아하는 크리에이터를 구독하고, 크리에이터는 일상,
            콘텐츠, 메시지 등을 통해 팬들과 더 가까이 소통할 수 있습니다.
          </p>
        </section>

        <section className="space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">왜 Velvet인가</h2>
          <p>
            우리는 앞으로 사람들이 더 많은 여가 시간을 가지게 되고, 그 시간은
            점점 더 콘텐츠와 사람에 집중될 것이라고 생각합니다.
          </p>
          <p>
            Velvet은 개인의 일상 자체가 콘텐츠가 되는 시대를 위한 플랫폼입니다.
          </p>
        </section>

        <section className="space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            Velvet이 제공하는 경험
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>일상 기반 콘텐츠</li>
            <li>구독자 전용 프리미엄 콘텐츠</li>
            <li>유료 게시글 및 메시지를 통한 소통</li>
            <li>크리에이터와의 더 가까운 관계</li>
          </ul>
        </section>

        <section className="space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            크리에이터와 팬의 관계
          </h2>
          <p>
            Velvet은 크리에이터와 팬 사이의 거리를 줄이고, 더 밀도 있는
            관계를 만드는 것을 목표로 합니다.
          </p>
        </section>

        <section className="space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">한 줄 정의</h2>
          <p className="font-medium text-white">
            Velvet은 크리에이터의 일상을 구독하는 플랫폼입니다.
          </p>
        </section>
      </div>
    </main>
  );
}