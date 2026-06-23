import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config()

async function main() {
  const { checkProjectionDrift } = await import(
    "../src/modules/projection/runtime/check-projection-drift"
  )

  const result = await checkProjectionDrift()

  console.log(JSON.stringify(result, null, 2))

  if (result.failedCount > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})