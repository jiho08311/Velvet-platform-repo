import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { getActiveSubscription } from "@/modules/subscription/server/get-active-subscription"

type CreatorRow = {
  id: string
  user_id: string
}

type AssertMessageSendEligibilityParams = {
  senderId: string
  otherUserId: string
}

export async function assertMessageSendEligibility({
  senderId,
  otherUserId,
}: AssertMessageSendEligibilityParams): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const { data: senderCreator, error: senderCreatorError } = await supabase
    .from("creators")
    .select("id, user_id")
    .eq("user_id", senderId)
    .maybeSingle<CreatorRow>()

  if (senderCreatorError) {
    throw senderCreatorError
  }

  const { data: otherCreator, error: otherCreatorError } = await supabase
    .from("creators")
    .select("id, user_id")
    .eq("user_id", otherUserId)
    .maybeSingle<CreatorRow>()

  if (otherCreatorError) {
    throw otherCreatorError
  }

  const senderIsCreator = Boolean(senderCreator)

  if (!senderIsCreator && otherCreator) {
    const subscription = await getActiveSubscription({
      userId: senderId,
      creatorId: otherCreator.id,
    })

    if (!subscription) {
      throw new Error("Subscription required")
    }
  }
}