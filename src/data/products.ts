import type { Product, SectionMeta } from './types'

export const productsSection: SectionMeta = {
  title: 'Собственные продукты',
  subtitle: 'С 2025-го я занимаюсь предпринимательством\nИногда — успешно',
}

export const products: Product[] = [
  {
    name: 'Preplab.ru',
    href: 'https://preplab.ru',
    icon: '/icons/preplab.svg',
    revenue: 'Выручка — пока тайна',
    revenueGreen: false,
  },
  {
    name: 'Whiteboard Challenge Knowledgebase',
    href: 'https://whiteboard.preplab.ru',
    icon: '/icons/whiteboard.svg',
    revenue: '+700k ₽',
    revenueGreen: true,
  },
  {
    name: 'AI-гайд для дизайнеров',
    href: 'https://uxguide.framer.ai/',
    icon: '/icons/ai-guide.svg',
    revenue: '+270k+ ₽',
    revenueGreen: true,
  },
  {
    name: 'Курс по метрикам для дизайнеров',
    href: 'https://metrics.framer.wiki/',
    icon: '/icons/metrics.png',
    revenue: '+300k+ ₽',
    revenueGreen: true,
  },
  {
    name: 'Карточная игра «Релиз»',
    href: 'https://release.framer.ai/',
    icon: '/icons/release.svg',
    revenue: '+200k+ ₽',
    revenueGreen: true,
  },
]
