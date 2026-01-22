import { Option } from '@/types/options'

export const WORK_SHIFT_VALUES = ['5/2', '2/2', '3/2', '1/1'] as const

export type WorkShiftCode = (typeof WORK_SHIFT_VALUES)[number]

export const WORK_SHIFT_OPTIONS: Option<WorkShiftCode>[] = [
  { value: '5/2', label: '5/2' },
  { value: '2/2', label: '2/2' },
  { value: '3/2', label: '3/2' },
  { value: '1/1', label: '1/1' },
]
