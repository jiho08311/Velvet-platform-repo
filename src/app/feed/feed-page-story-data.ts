import { getStories } from "@/modules/story/public/get-stories"
import { getStoryReadStateMap } from "@/modules/story/public/story-read-state"

export async function loadFeedStoryData(userId: string) {
  const [storyReadStateMap, stories] = await Promise.all([
    getStoryReadStateMap(userId),
    getStories(userId),
  ])

  return {
    readStateMap: Object.fromEntries(storyReadStateMap),
    stories,
  }
}
