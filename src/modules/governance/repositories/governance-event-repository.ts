import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type AppendGovernanceEventInput = {
  governanceEventKey: string
  aggregateOwner: string
  aggregateRoot: string
  domainName: string
  eventType: string
  eventStatus?: string
  governancePayload?: Record<string, unknown>
  correlationKeys?: Record<string, unknown>
  eventMetadata?: Record<string, unknown>
  provenanceMetadata?: Record<string, unknown>
}

export async function appendGovernanceEvent(
  input: AppendGovernanceEventInput
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_governance_event")
    .insert({
      governance_event_key: input.governanceEventKey,
      aggregate_owner: input.aggregateOwner,
      aggregate_root: input.aggregateRoot,
      domain_name: input.domainName,
      event_type: input.eventType,
      event_status: input.eventStatus ?? "recorded",
      governance_payload: input.governancePayload ?? {},
      correlation_keys: input.correlationKeys ?? {},
      event_metadata: input.eventMetadata ?? {},
      provenance_metadata: input.provenanceMetadata ?? {},
      authority_mode: "canonical_authoritative",
      enforcement_mode: "enforced",
      runtime_authoritative: true,
      serving_authoritative: true,
    })

  if (error) {
    throw error
  }
}
