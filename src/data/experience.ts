import type { Experience, SectionMeta } from './types'

export const experienceSection: SectionMeta = {
  title: 'Опыт в найме и проектах',
  // Subtitle is computed live from 1 Sept 2019 — see lib/experience.ts (designExperienceSubtitle).
}

// Not clickable for now (per Andrey) — no href field.
export const experience: Experience[] = [
  { name: 'EasyMiles', description: 'Тревел AI-компаньон', period: '2026', icon: '/icons/easymiles.png' },
  { name: 'Oversecured', description: 'AppSec B2B SaaS', period: '2025-now', icon: '/icons/oversecured.svg' },
  { name: 'PLASTILIN', description: 'AgroTech B2B SaaS', period: '2025-2026', icon: '/icons/plastilin.svg' },
  { name: 'm2vc', description: 'Венчурный фонд', period: '2025', icon: '/icons/m2vc.svg' },
  { name: 'Raiffeisen Bank', period: '2024-2025', icon: '/icons/raiffeisen.svg' },
  { name: 'Cloud.ru', description: 'Облачный провайдер', period: '2022-2024', icon: '/icons/cloud.svg' },
  { name: 'Pinkman', description: 'Топ-3 дизайн-студия РФ', period: '2020-2022', icon: '/icons/pinkman.svg' },
  { name: 'XYZ School', description: 'Школа геймдева', period: '2019-2021', icon: '/icons/xyz.svg' },
]
