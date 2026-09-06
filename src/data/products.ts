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
    revenue: { kind: 'note', text: 'Выручка — пока тайна' },
  },
  {
    name: 'Whiteboard Challenge Knowledgebase',
    href: 'https://whiteboard.preplab.ru',
    icon: '/icons/whiteboard.svg',
    revenue: { kind: 'value', prefix: '+', value: 700, suffix: 'k ₽' },
  },
  {
    name: 'AI-гайд для дизайнеров',
    href: 'https://uxguide.framer.ai/',
    icon: '/icons/ai-guide.svg',
    revenue: { kind: 'value', prefix: '+', value: 270, suffix: 'k ₽' },
  },
  {
    name: 'Курс по метрикам для дизайнеров',
    href: 'https://metrics.framer.wiki/',
    icon: '/icons/metrics.png',
    revenue: { kind: 'value', prefix: '+', value: 300, suffix: 'k ₽' },
  },
  {
    name: 'Карточная игра «Релиз»',
    href: 'https://release.framer.ai/',
    icon: '/icons/release.svg',
    revenue: { kind: 'value', prefix: '+', value: 200, suffix: 'k ₽' },
  },
]
