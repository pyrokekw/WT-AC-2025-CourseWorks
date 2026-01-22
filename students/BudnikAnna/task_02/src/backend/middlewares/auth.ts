import type { Response, NextFunction } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { UserModel } from '../models/User'
import { sendError } from '../helpers/sendResponse'
import type { AuthRequest } from '../types/auth-request'

type AccessTokenPayload = JwtPayload & {
    sub?: string
    role?: string
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 401, 'Unauthorized')
        }

        const token = authHeader.slice('Bearer '.length).trim()
        if (!token) return sendError(res, 401, 'Unauthorized')

        const secret = process.env.JWT_SECRET
        if (!secret) return sendError(res, 500, 'JWT_SECRET is not set')

        const decoded = jwt.verify(token, secret) as AccessTokenPayload
        const userId = decoded?.sub
        if (!userId) return sendError(res, 401, 'Unauthorized')

        const user = await UserModel.findById(userId)
        if (!user) return sendError(res, 401, 'Unauthorized')

        req.user = {
            id: String(user._id),
            name: String((user as any).name),
            email: String((user as any).email),
            role: String((user as any).role),
        }

        return next()
    } catch {
        return sendError(res, 401, 'Unauthorized')
    }
}
