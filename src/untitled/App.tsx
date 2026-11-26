import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import { Reveal, Stagger } from '../components/motion'

// Макет: Figma «Диз клуб». Страница тёмная всегда (data-theme="dark" в html).
const YEAR = 2026
const MONTH = 11 // декабрь (0-based)
const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

const offset = (new Date(YEAR, MONTH, 1).getDay() + 6) % 7 // неделя с понедельника
const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate()

const SPRING = { type: 'spring', stiffness: 260, damping: 30 } as const

/**
 * Наполнение карточек по дням. Внутри карточки правил нет: любой JSX,
 * фото на весь фон, canvas, ASCII-анимация. Карточка сама ничего не рисует,
 * только режет по скруглению (overflow-hidden) и анимирует появление.
 *
 * Чтобы текст/блоки появлялись по очереди, оборачивай их в <Item>.
 * Пример: CONTENT[7] = <><Item>…</Item><Item>…</Item></>
 */
const CONTENT: Record<number, ReactNode> = {}

// Контейнер смены контента: старое уходит в блюр вверх, новое поднимается снизу,
// дети (<Item>) подтягиваются по очереди.
const panel = (reduce: boolean): Variants =>
  reduce
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2, staggerChildren: 0.07 } },
        exit: { opacity: 0, filter: 'blur(8px)', transition: { duration: 0.16 } },
      }

const item = (reduce: boolean): Variants =>
  reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 18, filter: 'blur(10px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: SPRING },
      }

export function Item({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = !!useReducedMotion()
  return (
    <motion.div className={className} variants={item(reduce)}>
      {children}
    </motion.div>
  )
}

function Placeholder({ day }: { day: number }) {
  const date = new Date(YEAR, MONTH, day)
  const weekday = date.toLocaleDateString('ru-RU', { weekday: 'long' })
  const month = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  return (
    <div className="flex h-full flex-col justify-between p-6">
      <Item className="text-sm leading-5 text-muted">{weekday}</Item>
      <Item>
        <div className="text-[72px] font-normal leading-none tracking-[-0.06em] tabular-nums opacity-20">
          {day}
        </div>
        <div className="mt-2 text-base leading-5 text-muted">{month}</div>
      </Item>
    </div>
  )
}

function Cell({
  day,
  selected,
  onSelect,
}: {
  day: number
  selected: boolean
  onSelect: (day: number) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      aria-pressed={selected}
      aria-label={`${day} декабря`}
      className="group relative block aspect-square w-full cursor-pointer rounded-[22%] bg-surface-2 outline-none transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-line/40 focus-visible:ring-1 focus-visible:ring-primary/60"
    >
      {selected && (
        <motion.span
          layoutId="day-ring"
          aria-hidden
          transition={SPRING}
          className="pointer-events-none absolute inset-0 rounded-[inherit] border border-primary/60"
        />
      )}
      <span
        className={`absolute bottom-[9%] right-[12%] text-xs leading-4 tabular-nums transition-colors duration-200 lg:text-base lg:leading-5 ${
          selected ? 'text-primary' : 'text-muted group-hover:text-primary'
        }`}
      >
        {day}
      </span>
    </button>
  )
}

export default function App() {
  const [selected, setSelected] = useState(1)
  const cardRef = useRef<HTMLDivElement>(null)
  const reduce = !!useReducedMotion()

  const onSelect = (day: number) => {
    setSelected(day)
    // На мобиле календарь сверху, карточка снизу: подскроллить к ней.
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      cardRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-primary lg:px-8">
      <main className="flex w-full max-w-[1380px] flex-col gap-8 lg:gap-12">
        <Reveal>
          <h1 className="text-[32px] font-normal leading-9 tracking-[-0.04em]">
            Комьюнити «Го»
          </h1>
          <p className="mt-1 text-base leading-5 text-muted">Декабрь, 2026</p>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,931fr)_minmax(0,424fr)] lg:gap-[1.8%]">
          <div className="flex flex-col gap-3 lg:gap-6">
            <Reveal delay={0.05}>
              <div className="grid grid-cols-7 gap-1.5 lg:gap-2.5">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="flex h-5 items-center justify-center rounded-full bg-surface-2 text-xs leading-4 lg:h-8 lg:text-base lg:leading-5"
                  >
                    {d}
                  </div>
                ))}
              </div>
            </Reveal>

            <Stagger className="grid grid-cols-7 gap-1.5 lg:gap-2.5" stagger={0.015} y={12}>
              {Array.from({ length: offset }, (_, i) => (
                <div key={`pad-${i}`} aria-hidden />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => (
                <Cell key={i + 1} day={i + 1} selected={selected === i + 1} onSelect={onSelect} />
              ))}
            </Stagger>
          </div>

          {/* Правая карточка: на десктопе равна по высоте календарю, на мобиле идёт под ним. */}
          <Reveal delay={0.1} className="flex scroll-mt-4 flex-col">
            <div
              ref={cardRef}
              className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-surface-2 lg:aspect-auto lg:flex-1"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selected}
                  className="absolute inset-0"
                  variants={panel(reduce)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {CONTENT[selected] ?? <Placeholder day={selected} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  )
}
