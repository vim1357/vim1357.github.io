import { Reveal, Stagger } from '../components/motion'

// Макет: Figma «Диз клуб», Frame 1. Страница тёмная всегда (data-theme="dark" в html).
const YEAR = 2026
const MONTH = 11 // декабрь (0-based)
const MONTH_TITLE = 'Декабрь 2026'
const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

// Дни с кругом-заглушкой, как в макете. Наполнения пока нет.
const MARKED = new Set([2, 7, 12, 17, 22])

const offset = (new Date(YEAR, MONTH, 1).getDay() + 6) % 7 // неделя с понедельника
const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate()

function Cell({ day }: { day: number }) {
  return (
    <div className="group relative aspect-square rounded-card bg-surface-2 transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-line/40">
      {MARKED.has(day) && (
        <span
          aria-hidden
          className="absolute inset-x-[20%] top-[10%] aspect-square rounded-full bg-primary/10 transition-[transform,background-color] duration-300 ease-out group-hover:scale-110 group-hover:bg-primary/20"
        />
      )}
      <span className="absolute inset-x-0 bottom-1 text-center text-xs leading-4 tabular-nums text-muted transition-colors duration-200 group-hover:text-primary">
        {day}
      </span>
    </div>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-primary">
      <main className="flex w-full max-w-[596px] flex-col gap-8">
        <Reveal>
          <h1 className="text-[32px] font-normal leading-8 tracking-[-0.04em]">
            <span className="block opacity-20">Без названия</span>
            <span className="block">{MONTH_TITLE}</span>
          </h1>
        </Reveal>

        <div className="flex flex-col gap-4">
          <Reveal delay={0.05}>
            <div className="grid grid-cols-7 gap-[6px]">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="flex h-5 items-center justify-center rounded-full bg-surface-2 text-xs leading-4"
                >
                  {d}
                </div>
              ))}
            </div>
          </Reveal>

          <Stagger className="grid grid-cols-7 gap-[6px]" stagger={0.015} y={12}>
            {Array.from({ length: offset }, (_, i) => (
              <div key={`pad-${i}`} aria-hidden />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => (
              <Cell key={i + 1} day={i + 1} />
            ))}
          </Stagger>
        </div>
      </main>
    </div>
  )
}
