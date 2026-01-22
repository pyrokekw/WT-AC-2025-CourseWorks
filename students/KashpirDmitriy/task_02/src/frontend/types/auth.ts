import type { User, UserRole } from '@/types/user'

export type RegisterPayload = {
  email: string
  name: string
  surname: string
  age: number
  role: UserRole
  password: string
}

export type RegisterResponse = User

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    email: string
    name: string
    surname: string
    age: number
    role: UserRole
    id: number
  }
}
