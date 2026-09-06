import { profile, contacts } from '../data/profile'
import { ContactButton } from './rows'
import { Stagger } from './motion'
import { AvatarPlayer } from './AvatarPlayer'

export function Sidebar() {
  return (
    <aside className="w-full lg:sticky lg:top-8 lg:w-[360px] lg:flex-none lg:self-start">
      <Stagger className="flex flex-col gap-10" stagger={0.1} y={16}>
        <AvatarPlayer />

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
      </Stagger>
    </aside>
  )
}
