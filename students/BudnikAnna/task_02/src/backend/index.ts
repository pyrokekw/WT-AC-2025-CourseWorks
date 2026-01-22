import dotenv from 'dotenv'
dotenv.config()

import express, { Request, Response } from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { AuthRequest } from './types/auth-request'

import { UserModel } from './models/User'
import { ProjectModel } from './models/Project'
import { TagModel } from './models/Tag'
import { ContactModel } from './models/Contact'
import { ProjectCollectionModel } from './models/ProjectCollection'

import { sendError, sendResponse } from './helpers/sendResponse'
import { getExpiresIn } from './helpers/getExpiresIn'

import { authMiddleware } from './middlewares/auth'
import { adminOnlyMiddleware } from './middlewares/adminOnlyMiddleware'

const app = express()
app.use(
    cors({
        origin: ['http://localhost:5173'],
        credentials: true,
    })
)
app.use(express.json())

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isValidObjectId = (v: string) => mongoose.Types.ObjectId.isValid(v)

const resolveTagIdsByNames = async (tagNames: string[]) => {
    const names = Array.from(new Set(tagNames.map((t) => t.trim().toLowerCase()).filter(Boolean)))

    if (!names.length) {
        return { ids: [] as mongoose.Types.ObjectId[], missing: [] as string[] }
    }

    const found = await TagModel.find({ name: { $in: names } }).select('_id name')
    const map = new Map<string, mongoose.Types.ObjectId>(
        found.map((t: any) => [t.name, t._id as mongoose.Types.ObjectId])
    )

    const missing = names.filter((n) => !map.has(n))
    const ids = names.map((n) => map.get(n)!).filter(Boolean) as mongoose.Types.ObjectId[]

    return { ids, missing }
}

const toTagNames = (tags: any): string[] => {
    if (!Array.isArray(tags)) return []
    return tags.map((t) => (t?.name ? String(t.name) : '')).filter(Boolean)
}

type PopulatedTag = { _id: mongoose.Types.ObjectId; name: string; color?: string }
type PopulatedProject = {
    _id: mongoose.Types.ObjectId
    name: string
    description?: string
    stack?: string[]
    tags?: PopulatedTag[]
    imageUrl?: string
    createdAt?: Date
    updatedAt?: Date
}
type PopulatedCollection = {
    _id: mongoose.Types.ObjectId
    name: string
    description: string
    cover: string
    projects: PopulatedProject[]
    createdAt: Date
    updatedAt: Date
}

app.get('/api/health', async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
        message: 'API Work',
    })
})

// User

app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body as {
            name?: string
            email?: string
            password?: string
        }

        if (!name || !email || !password) {
            return sendError(res, 400, 'name, email, password are required')
        }

        if (password.length < 6) {
            return sendError(res, 400, 'password must be at least 6 chars')
        }

        const normalizedEmail = email.trim().toLowerCase()

        const exists = await UserModel.findOne({ email: normalizedEmail })
        if (exists) {
            return sendError(res, 409, 'User with this email already exists')
        }

        const user = await UserModel.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
        })

        const secret = process.env.JWT_SECRET
        if (!secret) {
            return sendError(res, 500, 'JWT_SECRET is not set')
        }

        const token = jwt.sign({ sub: String(user._id), role: user.role }, secret, {
            expiresIn: getExpiresIn(),
        })

        return sendResponse(res, 201, 'Registered', true, {
            token,
            user: {
                id: String(user._id),
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
        })
    } catch (err: any) {
        if (err?.code === 11000) {
            return sendError(res, 409, 'Email already exists')
        }
        console.log(err)
        return sendError(res, 500, 'Server error')
    }
})

app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body as { email?: string; password?: string }

        if (!email || !password) {
            return sendError(res, 400, 'email and password are required')
        }

        const normalizedEmail = email.trim().toLowerCase()

        const user = await UserModel.findOne({ email: normalizedEmail }).select('+password')
        if (!user) {
            return sendError(res, 401, 'Invalid email or password')
        }

        const ok = await user.comparePassword(password)
        if (!ok) {
            return sendError(res, 401, 'Invalid email or password')
        }

        const secret = process.env.JWT_SECRET
        if (!secret) {
            return sendError(res, 500, 'JWT_SECRET is not set')
        }

        const token = jwt.sign({ sub: String(user._id), role: user.role }, secret, {
            expiresIn: getExpiresIn(),
        })

        return sendResponse(res, 200, 'Logged in', true, {
            token,
            user: {
                id: String(user._id),
                name: user.name,
                email: user.email,
                role: user.role,
            },
        })
    } catch (err) {
        console.log(err)
        return sendError(res, 500, 'Server error')
    }
})

app.get('/api/profile', authMiddleware, (req: AuthRequest, res: Response) => {
    return sendResponse(res, 200, 'OK', true, { user: req.user })
})

app.post(
    '/api/admin/users',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { name, email, password, role } = req.body as {
                name?: string
                email?: string
                password?: string
                role?: 'user' | 'admin'
            }

            if (!name || !email || !password) {
                return sendError(res, 400, 'name, email, password are required')
            }

            if (password.length < 6) {
                return sendError(res, 400, 'password must be at least 6 chars')
            }

            const normalizedEmail = email.trim().toLowerCase()

            const allowedRoles = ['user', 'admin'] as const
            const finalRole = role ?? 'user'
            if (!allowedRoles.includes(finalRole)) {
                return sendError(res, 400, 'Invalid role')
            }

            const exists = await UserModel.findOne({ email: normalizedEmail })
            if (exists) {
                return sendError(res, 409, 'User with this email already exists')
            }

            const user = await UserModel.create({
                name: name.trim(),
                email: normalizedEmail,
                password,
                role: finalRole,
            })

            return sendResponse(res, 201, 'User created', true, {
                user: {
                    id: String(user._id),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt,
                },
            })
        } catch (err: any) {
            if (err?.code === 11000) {
                return sendError(res, 409, 'Email already exists')
            }
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.patch(
    '/api/admin/users/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params

            const { name, email, password, role } = req.body as {
                name?: string
                email?: string
                password?: string
                role?: 'user' | 'admin'
            }

            if (
                name === undefined &&
                email === undefined &&
                password === undefined &&
                role === undefined
            ) {
                return sendError(res, 400, 'Nothing to update')
            }

            const user = await UserModel.findById(id).select('+password')
            if (!user) {
                return sendError(res, 404, 'User not found')
            }

            // name
            if (name !== undefined) {
                const trimmed = name.trim()
                if (trimmed.length < 2) return sendError(res, 400, 'name is too short')
                user.name = trimmed
            }

            // email
            if (email !== undefined) {
                const normalizedEmail = email.trim().toLowerCase()
                if (!normalizedEmail) return sendError(res, 400, 'email is invalid')

                const exists = await UserModel.findOne({
                    email: normalizedEmail,
                    _id: { $ne: user._id },
                })

                if (exists) {
                    return sendError(res, 409, 'User with this email already exists')
                }

                user.email = normalizedEmail
            }

            if (password !== undefined) {
                if (password.length < 6) {
                    return sendError(res, 400, 'password must be at least 6 chars')
                }
                user.password = password
            }

            // role
            if (role !== undefined) {
                if (role !== 'user' && role !== 'admin') {
                    return sendError(res, 400, 'Invalid role')
                }
                user.role = role
            }

            await user.save()

            return sendResponse(res, 200, 'User updated', true, {
                user: {
                    id: String(user._id),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            })
        } catch (err: any) {
            if (err?.code === 11000) {
                return sendError(res, 409, 'Email already exists')
            }
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.delete(
    '/api/admin/users/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params

            const user = await UserModel.findById(id)
            if (!user) {
                return sendError(res, 404, 'User not found')
            }

            await UserModel.deleteOne({ _id: id })

            return sendResponse(res, 200, 'User deleted', true, {
                deletedUserId: id,
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.get(
    '/api/admin/users/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params

            const user = await UserModel.findById(id)
            if (!user) {
                return sendError(res, 404, 'User not found')
            }

            return sendResponse(res, 200, 'OK', true, {
                user: {
                    id: String(user._id),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.get(
    '/api/admin/users',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const pageRaw = String(req.query.page ?? '1')
            const limitRaw = String(req.query.limit ?? '10')
            const searchRaw = typeof req.query.search === 'string' ? req.query.search.trim() : ''

            const page = Math.max(parseInt(pageRaw, 10) || 1, 1)
            const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 10, 1), 100)
            const skip = (page - 1) * limit

            const filter: Record<string, any> = {}

            if (searchRaw) {
                const safe = escapeRegex(searchRaw)
                filter.$or = [
                    { name: { $regex: safe, $options: 'i' } },
                    { email: { $regex: safe, $options: 'i' } },
                ]
            }

            const [total, users] = await Promise.all([
                UserModel.countDocuments(filter),
                UserModel.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .select('_id name email role createdAt updatedAt'),
            ])

            const totalPages = Math.max(Math.ceil(total / limit), 1)

            return sendResponse(res, 200, 'OK', true, {
                users: users.map((u) => ({
                    id: String(u._id),
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    createdAt: u.createdAt,
                    updatedAt: u.updatedAt,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

// === PROJECTS ====

app.post(
    '/api/admin/projects',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { name, description, stack, tags, imageUrl } = req.body as {
                name?: string
                description?: string
                stack?: string[]
                tags?: string[]
                imageUrl?: string
            }

            if (!name) return sendError(res, 400, 'name is required')

            const trimmedName = name.trim()
            if (trimmedName.length < 2) return sendError(res, 400, 'name is too short')

            const normalizedDescription =
                description !== undefined ? String(description).trim() : undefined

            const normalizeStringArray = (value: unknown): string[] => {
                if (value === undefined) return []
                if (!Array.isArray(value)) return []
                return Array.from(
                    new Set(
                        value.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
                    )
                )
            }

            const normalizeImageUrl = (value: unknown): string => {
                if (value === undefined || value === null) return ''
                if (typeof value !== 'string') return ''
                const v = value.trim()
                if (!v) return ''

                try {
                    const url = new URL(v)
                    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
                    return url.toString()
                } catch {
                    return ''
                }
            }

            const normalizedStack = normalizeStringArray(stack)
            const normalizedTags = normalizeStringArray(tags)
            const { ids: tagIds, missing } = await resolveTagIdsByNames(normalizedTags)

            if (missing.length) {
                return sendError(res, 400, `Tags not found: ${missing.join(', ')}`)
            }

            const normalizedImageUrl = normalizeImageUrl(imageUrl)

            if (imageUrl !== undefined && !normalizedImageUrl) {
                return sendError(res, 400, 'imageUrl must be a valid http/https url')
            }

            const project = await ProjectModel.create({
                name: trimmedName,
                description: normalizedDescription,
                stack: normalizedStack,
                tags: tagIds,
                imageUrl: normalizedImageUrl,
            })

            const populatedProject = await project.populate('tags', '_id name color')
            if (!populatedProject) {
                return sendError(res, 500, 'Populate failed')
            }

            return sendResponse(res, 201, 'Project created', true, {
                project: {
                    id: String(project._id),
                    name: project.name,
                    description: project.description,
                    stack: project.stack,
                    tags: (populatedProject.tags as any[]).map((t) => t.name),
                    imageUrl: project.imageUrl,
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt,
                },
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.patch(
    '/api/admin/projects/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params

            const { name, description, stack, tags, imageUrl } = req.body as {
                name?: string
                description?: string
                stack?: unknown
                tags?: unknown // <-- важно: unknown, мы проверим Array.isArray
                imageUrl?: string
            }

            if (
                name === undefined &&
                description === undefined &&
                stack === undefined &&
                tags === undefined &&
                imageUrl === undefined
            ) {
                return sendError(res, 400, 'Nothing to update')
            }

            const project = await ProjectModel.findById(id)
            if (!project) return sendError(res, 404, 'Project not found')

            const normalizeStringArray = (value: unknown): string[] => {
                if (value === undefined) return []
                if (!Array.isArray(value)) return []
                return Array.from(
                    new Set(
                        value.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
                    )
                )
            }

            const normalizeImageUrl = (value: unknown): string => {
                if (value === undefined || value === null) return ''
                if (typeof value !== 'string') return ''
                const v = value.trim()
                if (!v) return '' // разрешаем очистить

                try {
                    const url = new URL(v)
                    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
                    return url.toString()
                } catch {
                    return ''
                }
            }

            // name
            if (name !== undefined) {
                const trimmed = String(name).trim()
                if (trimmed.length < 2) return sendError(res, 400, 'name is too short')
                if (trimmed.length > 120) return sendError(res, 400, 'name is too long')
                project.name = trimmed
            }

            // description
            if (description !== undefined) {
                const desc = String(description).trim()
                if (desc.length > 4000) return sendError(res, 400, 'description is too long')
                project.description = desc
            }

            // stack
            if (stack !== undefined) {
                if (!Array.isArray(stack)) {
                    return sendError(res, 400, 'stack must be an array of strings')
                }
                project.stack = normalizeStringArray(stack)
            }

            // ✅ tags (names) -> ObjectId[]
            if (tags !== undefined) {
                if (!Array.isArray(tags)) {
                    return sendError(res, 400, 'tags must be an array of strings')
                }

                const normalizedTags = normalizeStringArray(tags)
                const { ids: tagIds, missing } = await resolveTagIdsByNames(normalizedTags)

                if (missing.length) {
                    return sendError(res, 400, `Tags not found: ${missing.join(', ')}`)
                }

                project.tags = tagIds as any // tagIds = mongoose.Types.ObjectId[]
            }

            // imageUrl
            if (imageUrl !== undefined) {
                const normalized = normalizeImageUrl(imageUrl)
                if (String(imageUrl).trim() && !normalized) {
                    return sendError(res, 400, 'imageUrl must be a valid http/https url')
                }
                project.imageUrl = normalized
            }

            await project.save()

            const populatedProject = await project.populate('tags', '_id name color')
            if (!populatedProject) return sendError(res, 500, 'Populate failed')

            return sendResponse(res, 200, 'Project updated', true, {
                project: {
                    id: String(populatedProject._id),
                    name: populatedProject.name,
                    description: populatedProject.description,
                    stack: populatedProject.stack,
                    tags: (populatedProject.tags as any[]).map((t) => t.name),
                    imageUrl: populatedProject.imageUrl,
                    createdAt: populatedProject.createdAt,
                    updatedAt: populatedProject.updatedAt,
                },
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.delete(
    '/api/admin/projects/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return sendError(res, 400, 'Invalid project id')
            }

            const project = await ProjectModel.findById(id).select('_id')
            if (!project) {
                return sendError(res, 404, 'Project not found')
            }

            await ProjectModel.deleteOne({ _id: id })

            return sendResponse(res, 200, 'Project deleted', true, {
                deletedProjectId: id,
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.get('/api/projects', async (req: Request, res: Response) => {
    try {
        const pageRaw = String(req.query.page ?? '1')
        const limitRaw = String(req.query.limit ?? '10')
        const searchRaw = typeof req.query.search === 'string' ? req.query.search.trim() : ''
        const tagRaw = typeof req.query.tag === 'string' ? req.query.tag.trim() : '' // имя или id

        const page = Math.max(parseInt(pageRaw, 10) || 1, 1)
        const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 10, 1), 100)
        const skip = (page - 1) * limit

        const filter: Record<string, any> = {}

        // ✅ filter by tag (tag can be id or name)
        if (tagRaw) {
            if (mongoose.Types.ObjectId.isValid(tagRaw)) {
                filter.tags = tagRaw
            } else {
                const tagDoc = await TagModel.findOne({ name: tagRaw.toLowerCase() }).select('_id')
                if (!tagDoc) {
                    return sendResponse(res, 200, 'OK', true, {
                        projects: [],
                        pagination: {
                            page,
                            limit,
                            total: 0,
                            totalPages: 1,
                            hasNext: false,
                            hasPrev: page > 1,
                        },
                    })
                }
                filter.tags = String(tagDoc._id)
            }
        }

        // ✅ search: name/description/stack + tags via TagModel (because tags are ObjectId)
        if (searchRaw) {
            const safe = escapeRegex(searchRaw)

            const matchedTags = await TagModel.find({
                name: { $regex: safe, $options: 'i' },
            }).select('_id')

            const matchedTagIds = matchedTags.map((t) => String(t._id))

            filter.$or = [
                { name: { $regex: safe, $options: 'i' } },
                { description: { $regex: safe, $options: 'i' } },
                { stack: { $regex: safe, $options: 'i' } },
                ...(matchedTagIds.length ? [{ tags: { $in: matchedTagIds } }] : []),
            ]
        }

        const [total, projects] = await Promise.all([
            ProjectModel.countDocuments(filter),
            ProjectModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('_id name description stack tags imageUrl createdAt updatedAt')
                .populate('tags', '_id name color'),
        ])

        const totalPages = Math.max(Math.ceil(total / limit), 1)

        return sendResponse(res, 200, 'OK', true, {
            projects: projects.map((p: any) => ({
                id: String(p._id),
                name: p.name,
                description: p.description,
                stack: p.stack,
                tags: toTagNames(p.tags),
                imageUrl: p.imageUrl,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        })
    } catch (err) {
        console.log(err)
        return sendError(res, 500, 'Server error')
    }
})

app.get('/api/projects/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid project id')
        }

        const project = await ProjectModel.findById(id)
            .select('_id name description stack tags imageUrl createdAt updatedAt')
            .populate('tags', '_id name color')

        if (!project) return sendError(res, 404, 'Project not found')

        return sendResponse(res, 200, 'OK', true, {
            project: {
                id: String((project as any)._id),
                name: (project as any).name,
                description: (project as any).description,
                stack: (project as any).stack,
                tags: toTagNames((project as any).tags),
                imageUrl: (project as any).imageUrl,
                createdAt: (project as any).createdAt,
                updatedAt: (project as any).updatedAt,
            },
        })
    } catch (err) {
        console.log(err)
        return sendError(res, 500, 'Server error')
    }
})

// === Collections ===

app.post(
    '/api/admin/collections',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { name, description, cover, projects } = req.body as {
                name?: string
                description?: string
                cover?: unknown
                projects?: unknown
            }

            if (!name) return sendError(res, 400, 'name is required')
            const trimmedName = name.trim()
            if (trimmedName.length < 2) return sendError(res, 400, 'name is too short')

            const normalizedDescription =
                description !== undefined ? String(description).trim() : ''

            const normalizedCover = cover !== undefined ? String(cover).trim() : ''

            const normalizeIdArray = (value: unknown): string[] => {
                if (!Array.isArray(value)) return []
                return Array.from(new Set(value.map((x) => String(x).trim()).filter(Boolean)))
            }

            const projectIds = normalizeIdArray(projects)

            const invalidIds = projectIds.filter((id) => !isValidObjectId(id))
            if (invalidIds.length) {
                return sendError(res, 400, `Invalid project ids: ${invalidIds.join(', ')}`)
            }

            if (projectIds.length) {
                const found = await ProjectModel.find({ _id: { $in: projectIds } }).select('_id')
                const foundSet = new Set(found.map((p) => String(p._id)))
                const missing = projectIds.filter((id) => !foundSet.has(id))
                if (missing.length) {
                    return sendError(res, 400, `Projects not found: ${missing.join(', ')}`)
                }
            }

            const projectObjectIds = projectIds.map((x) => new mongoose.Types.ObjectId(x))

            const collection = await ProjectCollectionModel.create({
                name: trimmedName,
                description: normalizedDescription,
                cover: normalizedCover,
                projects: projectObjectIds,
            })

            const populated = await collection.populate({
                path: 'projects',
                select: '_id name description stack tags imageUrl createdAt updatedAt',
                populate: { path: 'tags', select: '_id name color' },
            })

            return sendResponse(res, 201, 'Collection created', true, {
                collection: {
                    id: String(populated._id),
                    name: populated.name,
                    description: populated.description,
                    cover: (populated as any).cover ?? '',
                    projects: (populated.projects as any[]).map((p) => ({
                        id: String(p._id),
                        name: p.name,
                        description: p.description,
                        stack: p.stack,
                        tags: toTagNames(p.tags),
                        imageUrl: p.imageUrl,
                        createdAt: p.createdAt,
                        updatedAt: p.updatedAt,
                    })),
                    createdAt: populated.createdAt,
                    updatedAt: populated.updatedAt,
                },
            })
        } catch (err: any) {
            if (err?.code === 11000) {
                return sendError(res, 409, 'Collection with this name already exists')
            }
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.patch(
    '/api/admin/collections/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params
            if (!mongoose.Types.ObjectId.isValid(id))
                return sendError(res, 400, 'Invalid collection id')

            const { name, description, cover, projects } = req.body as {
                name?: string
                description?: string
                cover?: unknown
                projects?: unknown
            }

            const update: Record<string, any> = {}

            if (name !== undefined) {
                const trimmedName = String(name).trim()
                if (trimmedName.length < 2) return sendError(res, 400, 'name is too short')
                update.name = trimmedName
            }

            if (cover !== undefined) {
                update.cover = String(cover).trim()
            }

            if (description !== undefined) {
                update.description = String(description).trim()
            }

            if (projects !== undefined) {
                if (!Array.isArray(projects))
                    return sendError(res, 400, 'projects must be an array')

                const projectIds = Array.from(
                    new Set(projects.map((x) => String(x).trim()).filter(Boolean))
                )

                const invalidIds = projectIds.filter((pid) => !isValidObjectId(pid))
                if (invalidIds.length) {
                    return sendError(res, 400, `Invalid project ids: ${invalidIds.join(', ')}`)
                }

                if (projectIds.length) {
                    const found = await ProjectModel.find({ _id: { $in: projectIds } })
                        .select('_id')
                        .lean()

                    const foundSet = new Set(found.map((p: any) => String(p._id)))
                    const missing = projectIds.filter((pid) => !foundSet.has(pid))
                    if (missing.length) {
                        return sendError(res, 400, `Projects not found: ${missing.join(', ')}`)
                    }
                }

                update.projects = projectIds
            }

            const collection = await ProjectCollectionModel.findByIdAndUpdate(id, update, {
                new: true,
                runValidators: true,
            })
                .populate({
                    path: 'projects',
                    select: '_id name description stack tags imageUrl createdAt updatedAt',
                    populate: { path: 'tags', select: '_id name color' },
                })
                .lean<PopulatedCollection>()
                .exec()

            if (!collection) return sendError(res, 404, 'Collection not found')

            return sendResponse(res, 200, 'Collection updated', true, {
                collection: {
                    id: String(collection._id),
                    name: collection.name,
                    description: collection.description,
                    cover: (collection as any).cover ?? '',
                    projects: (collection.projects ?? []).map((p) => ({
                        id: String(p._id),
                        name: p.name,
                        description: p.description,
                        stack: p.stack,
                        tags: p.tags,
                        imageUrl: p.imageUrl,
                        createdAt: p.createdAt,
                        updatedAt: p.updatedAt,
                    })),
                    createdAt: collection.createdAt,
                    updatedAt: collection.updatedAt,
                },
            })
        } catch (err: any) {
            if (err?.code === 11000) {
                return sendError(res, 409, 'Collection with this name already exists')
            }
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.delete(
    '/api/admin/collections/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params
            if (!mongoose.Types.ObjectId.isValid(id))
                return sendError(res, 400, 'Invalid collection id')

            const deleted = await ProjectCollectionModel.findByIdAndDelete(id)

            if (!deleted) return sendError(res, 404, 'Collection not found')

            return sendResponse(res, 200, 'Collection deleted', true, {
                id: String(deleted._id),
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

// app.get('/api/collections', async (req: Request, res: Response) => {
//     try {
//         const q = String(req.query.q ?? '').trim()
//         const filter: Record<string, any> = {}
//         if (q) filter.name = { $regex: q, $options: 'i' }

//         const collections = await ProjectCollectionModel.find(filter)
//             .select('_id name description cover projects createdAt updatedAt')
//             .sort({ createdAt: -1 })
//             .populate({
//                 path: 'projects',
//                 select: '_id name description stack tags imageUrl createdAt updatedAt',
//                 populate: { path: 'tags', select: '_id name color' },
//             })

//         return sendResponse(res, 200, 'OK', true, {
//             collections: collections.map((c: any) => ({
//                 id: String(c._id),
//                 name: c.name,
//                 description: c.description,
//                 cover: c.cover ?? '',
//                 projects: (c.projects ?? []).map((p: any) => ({
//                     id: String(p._id),
//                     name: p.name,
//                     description: p.description,
//                     stack: p.stack,
//                     tags: p.tags,
//                     imageUrl: p.imageUrl,
//                     createdAt: p.createdAt,
//                     updatedAt: p.updatedAt,
//                 })),
//                 createdAt: c.createdAt,
//                 updatedAt: c.updatedAt,
//             })),
//         })
//     } catch (err) {
//         console.log(err)
//         return sendError(res, 500, 'Server error')
//     }
// })

app.get('/api/collections', async (req, res) => {
    try {
        const q = String(req.query.q ?? '').trim()
        const filter: Record<string, any> = {}
        if (q) filter.name = { $regex: q, $options: 'i' }

        const collections = await ProjectCollectionModel.find(filter)
            .select('_id name description cover projects createdAt')
            .sort({ createdAt: -1 })
            .lean()

        return sendResponse(res, 200, 'OK', true, {
            collections: collections.map((c: any) => ({
                id: String(c._id),
                name: c.name,
                description: c.description,
                cover: c.cover ?? '',
                projectsCount: Array.isArray(c.projects) ? c.projects.length : 0,
                createdAt: c.createdAt,
            })),
        })
    } catch (err) {
        console.log(err)
        return sendError(res, 500, 'Server error')
    }
})

app.get('/api/collections/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        if (!mongoose.Types.ObjectId.isValid(id))
            return sendError(res, 400, 'Invalid collection id')

        const collection = await ProjectCollectionModel.findById(id)
            .select('_id name description cover projects createdAt updatedAt')
            .populate({
                path: 'projects',
                select: '_id name description stack tags imageUrl createdAt updatedAt',
                populate: { path: 'tags', select: '_id name color' },
            })

        if (!collection) return sendError(res, 404, 'Collection not found')

        return sendResponse(res, 200, 'OK', true, {
            collection: {
                id: String(collection._id),
                name: collection.name,
                cover: (collection as any).cover ?? '',
                description: collection.description,
                projects: (collection.projects as any[]).map((p) => ({
                    id: String(p._id),
                    name: p.name,
                    description: p.description,
                    tags: p.tags,
                    imageUrl: p.imageUrl,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                })),
                createdAt: collection.createdAt,
                updatedAt: collection.updatedAt,
            },
        })
    } catch (err) {
        console.log(err)
        return sendError(res, 500, 'Server error')
    }
})

app.get(
    '/api/admin/collections',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1)
            const limitRaw = parseInt(String(req.query.limit ?? '20'), 10) || 20
            const limit = Math.min(Math.max(limitRaw, 1), 100)
            const skip = (page - 1) * limit

            const q = String(req.query.q ?? '').trim()
            const filter: Record<string, any> = {}
            if (q) filter.name = { $regex: q, $options: 'i' }

            const [total, collections] = await Promise.all([
                ProjectCollectionModel.countDocuments(filter),
                ProjectCollectionModel.find(filter)
                    .select('_id name description cover projects createdAt updatedAt')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate({
                        path: 'projects',
                        select: '_id name imageUrl tags createdAt updatedAt',
                        populate: { path: 'tags', select: '_id name color' },
                    }),
            ])

            const pages = Math.max(Math.ceil(total / limit), 1)

            return sendResponse(res, 200, 'OK', true, {
                page,
                limit,
                total,
                pages,
                hasNextPage: page < pages,
                collections: collections.map((c: any) => ({
                    id: String(c._id),
                    name: c.name,
                    description: c.description,
                    cover: c.cover ?? '',
                    projectsCount: Array.isArray(c.projects) ? c.projects.length : 0,
                    projects: (c.projects ?? []).map((p: any) => ({
                        id: String(p._id),
                        name: p.name,
                        imageUrl: p.imageUrl,
                        tags: p.tags,
                        createdAt: p.createdAt,
                        updatedAt: p.updatedAt,
                    })),
                    createdAt: c.createdAt,
                    updatedAt: c.updatedAt,
                })),
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

// === TAGS ===

app.post(
    '/api/admin/tags',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { name, color } = req.body as { name?: string; color?: string }

            if (!name || !color) {
                return sendError(res, 400, 'name and color are required')
            }

            const normalizedName = name.trim().toLowerCase()
            if (normalizedName.length < 1) {
                return sendError(res, 400, 'name is invalid')
            }

            const normalizedColor = color.trim()
            const HEX_COLOR_REGEX = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/
            if (!HEX_COLOR_REGEX.test(normalizedColor)) {
                return sendError(res, 400, 'color must be a valid hex like #AABBCC or #ABC')
            }

            const exists = await TagModel.findOne({ name: normalizedName })
            if (exists) {
                return sendError(res, 409, 'Tag with this name already exists')
            }

            const tag = await TagModel.create({
                name: normalizedName,
                color: normalizedColor,
            })

            return sendResponse(res, 201, 'Tag created', true, {
                tag: {
                    id: String(tag._id),
                    name: tag.name,
                    color: tag.color,
                    createdAt: tag.createdAt,
                    updatedAt: tag.updatedAt,
                },
            })
        } catch (err: any) {
            if (err?.code === 11000) {
                return sendError(res, 409, 'Tag with this name already exists')
            }
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.get(
    '/api/admin/tags/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params

            const tag = await TagModel.findById(id)
            if (!tag) {
                return sendError(res, 404, 'Tag not found')
            }

            return sendResponse(res, 200, 'OK', true, {
                tag: {
                    id: String(tag._id),
                    name: tag.name,
                    color: tag.color,
                    createdAt: tag.createdAt,
                    updatedAt: tag.updatedAt,
                },
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.get('/api/tags', async (_req: Request, res: Response) => {
    try {
        const tags = await TagModel.find()
            .sort({ name: 1 })
            .select('_id name color createdAt updatedAt')

        return sendResponse(res, 200, 'OK', true, {
            tags: tags.map((t) => ({
                id: String(t._id),
                name: t.name,
                color: t.color,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            })),
        })
    } catch (err) {
        console.log(err)
        return sendError(res, 500, 'Server error')
    }
})

app.patch(
    '/api/admin/tags/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params
            const { name, color } = req.body as { name?: string; color?: string }

            if (name === undefined && color === undefined) {
                return sendError(res, 400, 'Nothing to update')
            }

            const tag = await TagModel.findById(id)
            if (!tag) {
                return sendError(res, 404, 'Tag not found')
            }

            if (name !== undefined) {
                const normalizedName = name.trim().toLowerCase()
                if (!normalizedName) return sendError(res, 400, 'name is invalid')

                const exists = await TagModel.findOne({
                    name: normalizedName,
                    _id: { $ne: tag._id },
                })
                if (exists) {
                    return sendError(res, 409, 'Tag with this name already exists')
                }

                tag.name = normalizedName
            }

            if (color !== undefined) {
                const normalizedColor = color.trim()
                const HEX_COLOR_REGEX = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/
                if (!HEX_COLOR_REGEX.test(normalizedColor)) {
                    return sendError(res, 400, 'color must be a valid hex like #AABBCC or #ABC')
                }

                tag.color = normalizedColor
            }

            await tag.save()

            return sendResponse(res, 200, 'Tag updated', true, {
                tag: {
                    id: String(tag._id),
                    name: tag.name,
                    color: tag.color,
                    createdAt: tag.createdAt,
                    updatedAt: tag.updatedAt,
                },
            })
        } catch (err: any) {
            if (err?.code === 11000) {
                return sendError(res, 409, 'Tag with this name already exists')
            }
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.delete(
    '/api/admin/tags/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params

            const tag = await TagModel.findById(id)
            if (!tag) {
                return sendError(res, 404, 'Tag not found')
            }

            await TagModel.deleteOne({ _id: id })

            return sendResponse(res, 200, 'Tag deleted', true, {
                deletedTagId: id,
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

// === CONTACTS ===

app.post('/api/contacts', async (req: Request, res: Response) => {
    try {
        const { name, email, message } = req.body as {
            name?: string
            email?: string
            message?: string
        }

        if (!name || !email) {
            return sendError(res, 400, 'name and email are required')
        }

        const normalizedName = name.trim()
        const normalizedEmail = email.trim().toLowerCase()

        if (normalizedName.length < 2) return sendError(res, 400, 'name is too short')

        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return sendError(res, 400, 'email is invalid')
        }

        const alreadySent = await ContactModel.findOne({ email: normalizedEmail }).select('_id')
        if (alreadySent) {
            return sendError(res, 409, 'Request from this email already exists')
        }

        const normalizedMessage = message !== undefined ? String(message).trim() : undefined

        const contact = await ContactModel.create({
            name: normalizedName,
            email: normalizedEmail,
            message: normalizedMessage,
            meta: {
                ip:
                    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
                    req.socket.remoteAddress ||
                    '',
                userAgent: String(req.headers['user-agent'] ?? ''),
            },
        })

        return sendResponse(res, 201, 'Contact request created', true, {
            contact: {
                id: String(contact._id),
                name: contact.name,
                email: contact.email,
                message: contact.message,
                createdAt: contact.createdAt,
            },
        })
    } catch (err: any) {
        if (err?.code === 11000) {
            return sendError(res, 409, 'Request from this email already exists')
        }
        console.log(err)
        return sendError(res, 500, 'Server error')
    }
})

app.get(
    '/api/admin/contacts',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const pageRaw = String(req.query.page ?? '1')
            const limitRaw = String(req.query.limit ?? '10')
            const searchRaw = typeof req.query.search === 'string' ? req.query.search.trim() : ''
            const isReadRaw = typeof req.query.isRead === 'string' ? req.query.isRead : undefined

            const page = Math.max(parseInt(pageRaw, 10) || 1, 1)
            const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 10, 1), 100)
            const skip = (page - 1) * limit

            const filter: Record<string, any> = {}

            if (isReadRaw === 'true') filter.isRead = true
            if (isReadRaw === 'false') filter.isRead = false

            if (searchRaw) {
                const safe = escapeRegex(searchRaw)
                filter.$or = [
                    { name: { $regex: safe, $options: 'i' } },
                    { email: { $regex: safe, $options: 'i' } },
                    { message: { $regex: safe, $options: 'i' } },
                ]
            }

            const [total, contacts] = await Promise.all([
                ContactModel.countDocuments(filter),
                ContactModel.find(filter)
                    .sort({ isRead: 1, createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .select('_id name email message isRead createdAt updatedAt'),
            ])

            const totalPages = Math.max(Math.ceil(total / limit), 1)

            return sendResponse(res, 200, 'OK', true, {
                contacts: contacts.map((c) => ({
                    id: String(c._id),
                    name: c.name,
                    email: c.email,
                    message: c.message,
                    isRead: c.isRead,
                    createdAt: c.createdAt,
                    updatedAt: c.updatedAt,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.get(
    '/api/admin/contacts/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params

            const contact = await ContactModel.findById(id).select(
                '_id name email message isRead meta createdAt updatedAt'
            )

            if (!contact) return sendError(res, 404, 'Contact not found')

            return sendResponse(res, 200, 'OK', true, {
                contact: {
                    id: String(contact._id),
                    name: contact.name,
                    email: contact.email,
                    message: contact.message,
                    isRead: contact.isRead,
                    meta: contact.meta,
                    createdAt: contact.createdAt,
                    updatedAt: contact.updatedAt,
                },
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

app.patch(
    '/api/admin/contacts/:id',
    authMiddleware,
    adminOnlyMiddleware,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params
            const { isRead } = req.body as { isRead?: boolean }

            if (isRead === undefined) {
                return sendError(res, 400, 'Nothing to update')
            }

            const contact = await ContactModel.findById(id)
            if (!contact) return sendError(res, 404, 'Contact not found')

            contact.isRead = Boolean(isRead)
            await contact.save()

            return sendResponse(res, 200, 'Contact updated', true, {
                contact: {
                    id: String(contact._id),
                    name: contact.name,
                    email: contact.email,
                    message: contact.message,
                    isRead: contact.isRead,
                    createdAt: contact.createdAt,
                    updatedAt: contact.updatedAt,
                },
            })
        } catch (err) {
            console.log(err)
            return sendError(res, 500, 'Server error')
        }
    }
)

mongoose
    .connect(process.env.MONGO_URI || '')
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port: ${process.env.PORT}`)
        })
    })
    .catch((error: unknown) => {
        const msg = error instanceof Error ? error.message : 'UNEXPECTED ERROR'
        console.log('Error:', msg)
    })
