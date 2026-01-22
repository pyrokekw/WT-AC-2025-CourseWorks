import { Option } from '@/types/options'

export const WORK_SCHEDULE_VALUES = [
  'полная занятость',
  'частичная занятость',
  'гибкий график',
  'сменный график',
  'удаленно',
  'гибрид',
] as const

export type WorkScheduleCode = (typeof WORK_SCHEDULE_VALUES)[number]

export const WORK_SCHEDULE_OPTIONS: Option<WorkScheduleCode>[] = [
  { value: 'полная занятость', label: 'Полная занятость' },
  { value: 'частичная занятость', label: 'Частичная занятость' },
  { value: 'гибкий график', label: 'Гибкий график' },
  { value: 'сменный график', label: 'Сменный график' },
  { value: 'удаленно', label: 'Удалённая работа' },
  { value: 'гибрид', label: 'Гибридный формат' },
]
