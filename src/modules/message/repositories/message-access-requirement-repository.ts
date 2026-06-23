import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type MessageAccessRequirementRow = {
  message_id: string
  access_type: "free" | "paid"
  price: number | null
  currency: string
  requires_payment: boolean
  access_requirement_state: string
}

export async function insertMessageAccessRequirement(input: {
  messageId: string
  accessType: "free" | "paid"
  price: number | null
  currency?: string
}): Promise<MessageAccessRequirementRow> {
  const supabase = await createSupabaseServerClient()
  const requiresPayment = input.accessType === "paid"

  const { data, error } = await supabase
    .from("canonical_message_access_requirements")
    .insert({
      message_id: input.messageId,
      access_type: input.accessType,
      price: input.price,
      currency: input.currency ?? "KRW",
      requires_payment: requiresPayment,
      access_requirement_state: "active",
      authority_mode: "canonical_authoritative",
      runtime_authoritative: true,
      serving_authoritative: true,
      rollback_safe: true,
    })
    .select(
      "message_id, access_type, price, currency, requires_payment, access_requirement_state"
    )
    .single<MessageAccessRequirementRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findMessageAccessRequirementByMessageId(
  messageId: string
): Promise<MessageAccessRequirementRow | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_message_access_requirements")
    .select(
      "message_id, access_type, price, currency, requires_payment, access_requirement_state"
    )
    .eq("message_id", messageId)
    .eq("access_requirement_state", "active")
    .maybeSingle<MessageAccessRequirementRow>()

  if (error) {
    throw error
  }

  return data
}