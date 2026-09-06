import { profile, contacts } from '../data/profile'
import { AssetImg } from './primitives'
import { ContactButton } from './rows'

/**
 * Avatar — static poster + play glyph + duration badge.
 * The real click-to-play video (the 0:45 circle) is wired up in a later step.
 */
function Avatar() {
  return (
    <div className="relative h-[120px] w-[120px] self-center lg:self-start">
      <div className="h-full w-full overflow-hidden rounded-full bg-surface">
        <AssetImg
          src={profile.avatar.poster}
          alt={profile.name}
          className="h-full w-full object-cover"
        />
      </div>
      {/* subtle dark scrim so the play glyph stays legible */}
      <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-full bg-black/20">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/90" aria-hidden>
          <path d="M8 5v14l11-7z" fill="currentColor" />
        </svg>
      </span>
      <span className="absolute bottom-1 right-1 rounded-badge bg-black/40 px-2 py-1 text-xs leading-none text-white">
        {profile.avatar.duration}
      </span>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="flex w-full flex-col gap-10 lg:sticky lg:top-8 lg:w-[360px] lg:flex-none lg:self-start">
      <Avatar />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col">
          <p className="text-sm leading-5 text-primary">{profile.name}</p>
          <p className="whitespace-pre-line text-sm leading-5 text-muted">{profile.tagline}</p>
        </div>
        {profile.bio.map((paragraph, i) => (
          <p key={i} className="text-sm leading-5 text-primary">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {contacts.map((c) => (
          <ContactButton key={c.label} item={c} />
        ))}
      </div>
    </aside>
  )
}
