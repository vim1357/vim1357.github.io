import type { CaseCard, SectionMeta } from './types'

export const casesSection: SectionMeta = {
  title: 'Кейсы',
}

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.'

// Roles from the résumé (Life OS 09_resume-duo-sapiens.md). Covers and copy are placeholders.
export const cases: CaseCard[] = [
  { name: '2PR', role: 'Дизайн-лид', icon: '/icons/2pr.svg', text: LOREM },
  { name: 'Oversecured', role: 'Дизайн-лид', icon: '/icons/oversecured.svg', text: LOREM },
  { name: 'Preplab', role: 'Фаундер', icon: '/icons/preplab.svg', text: LOREM },
  { name: 'Cloud.ru', role: 'Продуктовый дизайн-лид', icon: '/icons/cloud.svg', text: LOREM },
  { name: 'Raiffeisen Bank', role: 'Senior UX-дизайнер', icon: '/icons/raiffeisen.svg', text: LOREM },
]
