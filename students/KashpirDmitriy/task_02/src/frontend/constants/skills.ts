import { Option } from '@/types/options'

export const SKILL_VALUES = [
  'DevOps',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'AI/ML',
  'Cybersecurity',
  'Blockchain',
  'Game Development',
  'UI/UX Design',
] as const

export type SkillCode = (typeof SKILL_VALUES)[number]

export const SKILL_OPTIONS: Option<SkillCode>[] = [
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Web Development', label: 'Веб-разработка' },
  { value: 'Mobile Development', label: 'Мобильная разработка' },
  { value: 'Data Science', label: 'Data Science' },
  { value: 'AI/ML', label: 'AI / ML' },
  { value: 'Cybersecurity', label: 'Кибербезопасность' },
  { value: 'Blockchain', label: 'Blockchain' },
  { value: 'Game Development', label: 'Разработка игр' },
  { value: 'UI/UX Design', label: 'UI/UX-дизайн' },
]
