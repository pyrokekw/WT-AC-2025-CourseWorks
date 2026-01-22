export type ContactMeta = {
    ip?: string
    userAgent?: string
}

export type Contact = {
    id: string
    name: string
    email: string
    message?: string
    isRead: boolean
    meta?: ContactMeta
    createdAt: string
    updatedAt: string
}

export type Pagination = {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

export type ContactsListData = {
    contacts: Contact[]
    pagination: Pagination
}

export type ContactDetailsData = {
    contact: Contact
}

export type ApiEnvelope<T> = {
    message: string
    success: boolean
    data: T
}
