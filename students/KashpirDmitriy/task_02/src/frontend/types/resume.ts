import type { LanguageCode } from '@/constants/languages'
import type { SkillCode } from '@/constants/skills'

export interface Resume {
  id: number
  userid: number
  title: string
  language: LanguageCode[]
  skills: SkillCode[]
  description: string
  workExperience: number
}

export type ResumePayload = Omit<Resume, 'id'>
