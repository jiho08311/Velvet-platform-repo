export async function createPayout(): Promise<never> {
  throw new Error(
    "DEPRECATED: use approve_payout_request_and_create_payout RPC instead"
  )
}