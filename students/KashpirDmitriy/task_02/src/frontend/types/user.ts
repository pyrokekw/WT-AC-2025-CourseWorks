export type UserRole = 'worker' | 'employer' | 'admin'

export interface User {
  email: string
  name: string
  surname: string
  age: number
  role: UserRole
  id: number
}
