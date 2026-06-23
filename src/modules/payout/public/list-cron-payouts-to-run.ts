import { listCronPayoutRowsToRun } from "@/modules/payout/repositories/payout-read-repository"

export const PUBLIC_CONTRACT = true

export type CronPayoutToRun = {
  id: string
}

export async function listCronPayoutsToRun(): Promise<CronPayoutToRun[]> {
  return listCronPayoutRowsToRun()
}
