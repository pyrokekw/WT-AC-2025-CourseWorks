import type { Option } from '@/types/options'

export const LANGUAGE_VALUES = ['ru', 'en', 'be'] as const
export type LanguageCode = (typeof LANGUAGE_VALUES)[number]

export const LANGUAGE_OPTIONS: Option<LanguageCode>[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'Английский' },
  { value: 'be', label: 'Беларусский' },
]
