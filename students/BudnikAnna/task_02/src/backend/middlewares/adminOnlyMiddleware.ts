import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../types/auth-request'
import { sendError } from '../helpers/sendResponse'

export const adminOnlyMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return sendError(res, 401, 'Unauthorized')
    }

    if (req.user.role !== 'admin') {
        return sendError(res, 403, 'Forbidden')
    }

    return next()
}
