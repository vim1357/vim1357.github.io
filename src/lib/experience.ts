// Live "years / months / days in design" counter, from 1 Sept 2019.
// Runs client-side; static hosting is unaffected. Refreshes on each page load.

const YEARS = ['год', 'года', 'лет']
const MONTHS = ['месяц', 'месяца', 'месяцев']
const DAYS = ['день', 'дня', 'дней']

function plural(n: number, forms: [string, string, string]): string {
  const a = n % 10
  const b = n % 100
  if (a === 1 && b !== 11) return forms[0]
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return forms[1]
  return forms[2]
}

const START = new Date(2019, 8, 1) // month is 0-indexed → 8 = September

export function designExperienceSubtitle(now: Date = new Date()): string {
  let y = now.getFullYear() - START.getFullYear()
  let m = now.getMonth() - START.getMonth()
  let d = now.getDate() - START.getDate()
  if (d < 0) {
    m -= 1
    d += new Date(now.getFullYear(), now.getMonth(), 0).getDate() // days in previous month
  }
  if (m < 0) {
    y -= 1
    m += 12
  }
  return (
    `Я в дизайне уже ${y} ${plural(y, YEARS as [string, string, string])} ` +
    `${m} ${plural(m, MONTHS as [string, string, string])} ` +
    `${d} ${plural(d, DAYS as [string, string, string])}\n` +
    `Собрал тут только самое значимое`
  )
}
