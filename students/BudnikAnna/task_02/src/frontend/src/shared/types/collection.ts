import { Project } from './project'

export type Collection = {
    id: string
    name: string
    description: string
    cover: string
    projects: Project[]
    createdAt: string
    updatedAt: string
}

export type CollectionLanding = Pick<
    Collection,
    'id' | 'name' | 'description' | 'cover' | 'createdAt'
> & {
    projectsCount?: number
}
