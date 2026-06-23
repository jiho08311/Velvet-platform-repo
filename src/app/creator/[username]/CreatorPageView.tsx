import { CREATOR_PAGE_PRESENTATION } from "@/modules/creator/public/creator-page-ui"
import { ReportButton } from "@/modules/report/public/report-button-ui"
import { SubscriptionStatusCard } from "@/modules/subscription/public/subscription-status-ui"
import { CreatorActionSection } from "./CreatorActionSection"
import { CreatorIdentitySection } from "./CreatorIdentitySection"
import { CreatorPageAside } from "./CreatorPageAside"
import { CreatorPageContent } from "./CreatorPageContent"
import { CreatorStatsSection } from "./CreatorStatsSection"
import type { CreatorPageData } from "./creator-page-data"

export function CreatorPageView({ data }: { data: CreatorPageData }) {
  const { creator } = data

  return (
    <main className="min-h-screen">
      <div className="grid w-full grid-cols-1 gap-6 px-0 pb-6 pt-6 lg:grid-cols-[600px_378px] lg:gap-8 lg:px-0">
        <section className="min-w-0 w-full max-w-[600px] px-4 mx-auto lg:mx-0 lg:px-0">
          <div className="h-40 w-full rounded-3xl bg-gradient-to-r from-[#C2185B] via-[#D81B60] to-[#F06292]" />

          <div className="mt-[-40px] flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <CreatorIdentitySection
              displayName={data.displayName}
              username={creator.username}
              avatarUrl={creator.avatarUrl}
            />

            <CreatorActionSection
              isOwner={data.isOwner}
              creatorId={creator.id}
              creatorUserId={creator.userId}
              creatorUsername={creator.username}
              currentUserId={data.userId ?? undefined}
              subscriptionPrice={creator.subscriptionPrice}
              displayName={data.displayName}
            />
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-6 text-zinc-400">
            {creator.bio ?? CREATOR_PAGE_PRESENTATION.bioFallback}
          </p>

          {!data.isOwner ? (
            <div className="mt-3">
              <ReportButton
                payload={{
                  targetType: "creator",
                  targetId: creator.id,
                  pathname: data.pathname,
                }}
                currentUserId={data.userId ?? undefined}
              />
            </div>
          ) : null}

          {!data.isOwner ? (
            <div className="mt-5">
              <SubscriptionStatusCard
                status={data.status}
                currentPeriodEndAt={null}
              />
            </div>
          ) : null}

          <CreatorStatsSection
            mediaPostCount={data.mediaPosts.length}
            updatePostCount={data.updatePosts.length}
            subscriberCount={data.subscriberCount}
          />

          <CreatorPageContent
            creatorId={creator.id}
            isOwner={data.isOwner}
            mediaPosts={data.mediaPosts}
            posts={data.posts}
            updatePosts={data.updatePosts}
          />
        </section>

        <CreatorPageAside data={data} />
      </div>
    </main>
  )
}
