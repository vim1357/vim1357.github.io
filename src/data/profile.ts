import type { Contact } from './types'

export const profile = {
  name: 'Андрей Одокиенко',
  // '\n' = hard break as in the Figma layout (render with whitespace-pre-line)
  tagline: 'Дизайнер по профессии —\nи фаундер по своему выбору',
  bio: [
    'Продуктовый дизайн-лид с опытом в HR, банках, страховании, B2B | Enterprise SaaS. Закрываю дизайн разных частей продукта: сайты, клиентские и внутренние интерфейсы, мобильные приложения, дизайн-системы',
    'Работаю со стартапами на ранней стадии, обучаю дизайнеров и запускаю свои продукты',
  ],
  // Avatar video (the 0:45 circle) is wired up in a later step.
  avatar: {
    poster: '/content/avatar-poster.jpg',
    video: '/content/avatar.mp4',
    duration: '0:45',
  },
}

export const contacts: Contact[] = [
  {
    label: 'Позвать на онлайн-кофе (30 мин)',
    href: 'https://calendar.app.google/1tgJYEmpCFgDzKwg8',
    icon: '/icons/gcal.png',
  },
  {
    label: 'odokienkoan@gmail.com',
    href: 'mailto:odokienkoan@gmail.com',
    icon: '/icons/gmail.png',
  },
  {
    label: 'Написать в Telegram',
    href: 'https://t.me/odokienkoan',
    icon: '/icons/telegram.svg',
    accent: true,
  },
]
