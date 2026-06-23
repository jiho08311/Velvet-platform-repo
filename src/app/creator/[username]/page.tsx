import { notFound } from "next/navigation"
import { loadCreatorPageData } from "./creator-page-data"
import { CreatorPageView } from "./CreatorPageView"

type CreatorPageProps = {
  params: Promise<{
    username: string
  }>
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { username } = await params

  if (!username) {
    notFound()
  }

  const data = await loadCreatorPageData(username)

  if (!data) {
    notFound()
  }

  return <CreatorPageView data={data} />
}
