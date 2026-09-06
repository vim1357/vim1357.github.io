import type { Experience, SectionMeta } from './types'

export const experienceSection: SectionMeta = {
  title: 'Опыт в найме и проектах',
  // Subtitle is computed live from 1 Sept 2019 — see lib/experience.ts (designExperienceSubtitle).
}

// Cards expand on click to reveal `blurb` (from Life OS 08_track-record-blurbs.md).
export const experience: Experience[] = [
  {
    name: 'EasyMiles',
    description: 'Тревел AI-компаньон',
    period: '2026',
    icon: '/icons/easymiles.png',
    blurb:
      'Помогаю стартапу с маркетинговыми материалами, питчдеками, дизайном сайта и мобильного приложения.',
  },
  {
    name: 'Oversecured',
    description: 'AppSec B2B SaaS',
    period: '2025-now',
    icon: '/icons/oversecured.svg',
    blurb:
      'Дизайн-поддержка платформы + маркетинг (КП, презентации, SMM). Внедрил в продуктовую команду подход разработки на shadcn — ускорили частоту релизов и команду разработки в несколько раз.',
  },
  {
    name: 'PLASTILIN',
    description: 'AgroTech B2B SaaS',
    period: '2025-2026',
    icon: '/icons/plastilin.svg',
    blurb:
      'Проект на дизайн-поддержке: лидировал дизайнеров, развивал существующие разделы, внедрял новые части продукта (0 → 1).',
  },
  {
    name: 'm2vc',
    description: 'Венчурный фонд',
    period: '2025',
    icon: '/icons/m2vc.svg',
    blurb: 'Разработал дизайн отчётности фонда.',
  },
  {
    name: 'Raiffeisen Bank',
    period: '2024-2025',
    icon: '/icons/raiffeisen.svg',
    blurb:
      'Работал над внутренним порталом для сотрудников: база знаний, медиа/UGC, конструктор страниц, опросы. Работал над дизайном базы знаний на платформе (0 → 1). Вместе с командой вырастил внутреннюю метрику ICX +17%.',
  },
  {
    name: 'Cloud.ru',
    description: 'Облачный провайдер',
    period: '2022-2024',
    icon: '/icons/cloud.svg',
    blurb:
      'Был дизайн-лидом, отвечал за ядро кабинета, внешний сайт и карьерный портал. Конверсия в payment usage ×2. В ходе редизайна сайта поднял конверсию в регистрацию ×1,5 и время сессии ×2. Нанял 15+ дизайнеров (от джунов до лидов направлений). Внедрил процесс исследований в юните из 5 продуктов.',
  },
  {
    name: 'Pinkman',
    description: 'Топ-3 дизайн-студия РФ',
    period: '2020-2022',
    icon: '/icons/pinkman.svg',
    blurb:
      'Прошёл путь от джуна до дизайн-лида. Вёл проекты РСХБ, ВТБ, Росгосстраха. Участвовал в тендерах и пресейлах. Моя команда дизайнеров перевыполняла план на 20% три квартала подряд.',
  },
  {
    name: 'XYZ School',
    description: 'Школа геймдева',
    period: '2019-2021',
    icon: '/icons/xyz.svg',
    blurb: 'Начало карьеры: дизайн для соцсетей, сайта и обучающих материалов.',
  },
]
