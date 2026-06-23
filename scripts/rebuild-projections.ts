import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config()

async function main() {
  const { rebuildAllProjections } = await import(
    "../src/modules/projection/runtime/rebuild-all-projections"
  )

  const dryRun = process.argv.includes("--dry-run")
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="))
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 5000

  const result = await rebuildAllProjections({
    dryRun,
    limit,
  })

  console.log(JSON.stringify(result, null, 2))

  if (result.failedCount > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})