import { ThemeToggle } from './ThemeToggle'
import { Tooltip } from './Tooltip'

// Shared look/size so the RU indicator and the theme toggle match exactly.
const CONTROL =
  'grid h-10 w-10 place-items-center rounded-btn bg-surface text-sm leading-none text-primary transition-colors hover:bg-surface-2'

/** Corner cluster: language indicator (RU) + theme toggle. */
export function TopControls({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <Tooltip content="пока только на русском" side="bottom">
        <button type="button" className={CONTROL} aria-label="Язык: пока только русский">
          RU
        </button>
      </Tooltip>
      <ThemeToggle className={CONTROL} />
    </div>
  )
}
