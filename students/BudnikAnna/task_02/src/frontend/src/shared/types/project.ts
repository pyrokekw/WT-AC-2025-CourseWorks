import type { Tag } from './tag'

export type Project = {
    _id: string
    name: string
    description?: string
    stack?: string[]
    tags?: Tag[]
    imageUrl?: string
    createdAt?: string
    updatedAt?: string
}
