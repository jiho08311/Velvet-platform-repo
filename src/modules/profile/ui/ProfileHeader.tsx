type ProfileHeaderProps = {
  avatarUrl: string | null
  displayName: string
  username: string
  bio: string
}

const profileHeaderClassName = "border border-zinc-200 bg-white p-5 shadow-sm"
const profileHeaderContentClassName = "flex items-start gap-4"
const avatarFrameClassName =
  "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100"
const avatarImageClassName = "h-full w-full object-cover"
const avatarFallbackClassName = "text-xl font-semibold text-zinc-500"
const identityClassName = "min-w-0 flex-1"
const displayNameClassName = "truncate text-lg font-semibold text-zinc-900"
const usernameClassName = "mt-1 text-sm text-zinc-500"
const bioClassName = "mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700"

function getAvatarFallbackLabel(displayName: string) {
  return displayName.slice(0, 1).toUpperCase()
}

function ProfileAvatar({
  avatarUrl,
  displayName,
}: Pick<ProfileHeaderProps, "avatarUrl" | "displayName">) {
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

function ProfileIdentity({
  displayName,
  username,
  bio,
}: Pick<ProfileHeaderProps, "displayName" | "username" | "bio">) {
  return (
    <div className={identityClassName}>
      <h1 className={displayNameClassName}>{displayName}</h1>
      <p className={usernameClassName}>@{username}</p>
      <p className={bioClassName}>{bio}</p>
    </div>
  )
}

export function ProfileHeader({
  avatarUrl,
  displayName,
  username,
  bio,
}: ProfileHeaderProps) {
  return (
    <section className={profileHeaderClassName}>
      <div className={profileHeaderContentClassName}>
        <ProfileAvatar avatarUrl={avatarUrl} displayName={displayName} />
        <ProfileIdentity
          displayName={displayName}
          username={username}
          bio={bio}
        />
      </div>
    </section>
  )
}
