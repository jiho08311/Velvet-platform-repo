import {
  runFinancialReconciliation as runFinancialReconciliationRuntime,
} from "@/modules/ledger/runtime/run-financial-reconciliation"

export const PUBLIC_CONTRACT = true

export type RunFinancialReconciliationInput = Parameters<
  typeof runFinancialReconciliationRuntime
>[0]
export type RunFinancialReconciliationResult = Awaited<
  ReturnType<typeof runFinancialReconciliationRuntime>
>

export async function runFinancialReconciliation(
  input: RunFinancialReconciliationInput
): Promise<RunFinancialReconciliationResult> {
  return runFinancialReconciliationRuntime(input)
}
