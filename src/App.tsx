/**
 * Layout shell (Step 2): tokens + responsive two-column grid.
 * Metrics mirror the Figma "desktop" frame:
 *   content 860px centred · left 360 (sticky) · right 400 · gap 100 · rhythm 40.
 * Mobile: single column, right stacks under left.
 * Placeholder boxes get replaced by real blocks in Steps 4–5.
 */

function Placeholder({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div
      className={`grid place-items-center rounded-card border border-dashed border-line bg-surface/40 text-center text-sm text-muted ${className}`}
    >
      {label}
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-primary">
      <main className="mx-auto flex max-w-[860px] flex-col gap-16 px-6 py-8 lg:flex-row lg:gap-[100px] lg:py-8">
        {/* LEFT — profile (sticky on desktop) */}
        <aside className="flex w-full flex-col gap-10 lg:w-[360px] lg:flex-none lg:sticky lg:top-8 lg:self-start">
          <Placeholder label="Аватар · видео 0:45" className="h-[120px] w-[120px] self-center rounded-full lg:self-start" />
          <Placeholder label="Имя · тэглайн · био" className="h-[240px]" />
          <Placeholder label="3 контакт-кнопки" className="h-[148px]" />
        </aside>

        {/* RIGHT — content */}
        <section className="flex w-full flex-col gap-10 lg:w-[400px] lg:flex-none">
          <Placeholder label="Собственные продукты" className="h-[352px]" />
          <Placeholder label="Опыт в найме и проектах" className="h-[514px]" />
          <Placeholder label="Где меня можно найти" className="h-[124px]" />
          <Placeholder label="Манифест" className="h-[192px]" />
        </section>
      </main>
    </div>
  )
}
