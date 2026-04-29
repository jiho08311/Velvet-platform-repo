type CreatorHeaderProps = {
  avatarUrl: string | null
  displayName: string
  username: string
  bio: string
  subscriptionprice: number
  status: "pending" | "active" | "suspended"
}

const creatorHeaderClassName =
  "rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white shadow-sm"
const creatorHeaderContentClassName = "flex items-start gap-4"
const avatarFrameClassName =
  "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10"
const avatarImageClassName = "h-full w-full object-cover"
const avatarFallbackClassName = "text-2xl font-semibold text-white/60"
const identityClassName = "min-w-0 flex-1"
const displayNameClassName = "truncate text-2xl font-semibold tracking-tight"
const usernameClassName = "mt-1 text-sm text-white/60"
const bioClassName = "mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75"
const subscriptionPriceClassName =
  "mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85"

function getAvatarFallbackLabel(displayName: string) {
  return displayName.slice(0, 1).toUpperCase()
}

function formatSubscriptionPrice(subscriptionprice: number) {
  return `₩${subscriptionprice.toLocaleString()} 구독`
}

function CreatorAvatar({
  avatarUrl,
  displayName,
}: Pick<CreatorHeaderProps, "avatarUrl" | "displayName">) {
  return (
    <div className={avatarFrameClassName}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className={avatarImageClassName}
        />
      ) : (
        <div className={avatarFallbackClassName}>
          {getAvatarFallbackLabel(displayName)}
        </div>
      )}
    </div>
  )
}

function CreatorIdentity({
  displayName,
  username,
  bio,
  subscriptionprice,
}: Pick<
  CreatorHeaderProps,
  "displayName" | "username" | "bio" | "subscriptionprice"
>) {
  return (
    <div className={identityClassName}>
      <h1 className={displayNameClassName}>{displayName}</h1>

      <p className={usernameClassName}>@{username}</p>

      <p className={bioClassName}>{bio}</p>

      <div className={subscriptionPriceClassName}>
        {formatSubscriptionPrice(subscriptionprice)}
      </div>
    </div>
  )
}

export function CreatorHeader({
  avatarUrl,
  displayName,
  username,
  bio,
  subscriptionprice,
}: CreatorHeaderProps) {
  return (
    <section className={creatorHeaderClassName}>
      <div className={creatorHeaderContentClassName}>
        <CreatorAvatar avatarUrl={avatarUrl} displayName={displayName} />
        <CreatorIdentity
          displayName={displayName}
          username={username}
          bio={bio}
          subscriptionprice={subscriptionprice}
        />
      </div>
    </section>
  )
}
