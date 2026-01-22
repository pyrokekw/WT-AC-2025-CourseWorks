import { create } from 'zustand'
import type { Resume } from '@/types/resume'

type ResumeState = {
  resume: Resume | null
  setResume: (resume: Resume | null) => void
  clearResume: () => void
}

export const useResumeStore = create<ResumeState>((set) => ({
  resume: null,
  setResume: (resume) => set({ resume }),
  clearResume: () => set({ resume: null }),
}))
