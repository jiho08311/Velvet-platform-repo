export function buildDefaultUsername(
  email: string,
  userId: string,
): string {
  const base =
    email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user"

  return `${base}_${userId.slice(0, 4)}`
}