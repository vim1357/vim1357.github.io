import type { CaseCard, SectionMeta } from './types'

export const casesSection: SectionMeta = {
  title: 'Кейсы',
}

// Roles from the résumé (Life OS 09_resume-duo-sapiens.md). Cases without `visual` show a grey placeholder.
// Keep `text` within two lines — the card clamps it.
export const cases: CaseCard[] = [
  {
    name: '2PR',
    role: 'Дизайн-лид',
    icon: '/icons/2pr.svg',
    text: 'Изменил дизайн главной страницы — конверсия в регистрацию ×1,5',
  },
  {
    name: 'Oversecured',
    role: 'Дизайн-лид',
    icon: '/icons/oversecured.svg',
    visual: 'oversecured',
    text: 'Предложил разработку на shadcn и перестроил тестирование гипотез — TTM ×4',
  },
  {
    name: 'Preplab',
    role: 'Фаундер',
    icon: '/icons/preplab.svg',
    visual: 'preplab',
    text: 'Запустил собственный продукт с нуля (0\u00a0→\u00a01). Монетизация в B2C и B2B',
  },
  {
    name: 'Cloud.ru',
    role: 'Продуктовый дизайн-лид',
    icon: '/icons/cloud.svg',
    text: 'Нанял 10+ человек. Конверсия в платное потребление ×2, в регистрацию ×1,5',
  },
  {
    name: 'Raiffeisen Bank',
    role: 'Senior UX-дизайнер',
    icon: '/icons/raiffeisen.svg',
    text: 'Запустил корпоративную базу знаний (0\u00a0→\u00a01). Метрика удовлетворённости ICX\u00a0+15%',
  },
]
