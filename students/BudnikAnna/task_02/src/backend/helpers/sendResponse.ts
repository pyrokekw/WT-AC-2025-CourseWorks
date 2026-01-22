import type { Response } from 'express'

export type ApiResponse<T> = {
    message: string
    success: boolean
    data: T
}

export const sendResponse = <T>(
    res: Response,
    status: number,
    message: string,
    success: boolean,
    data: T
) => {
    return res.status(status).json({
        message,
        success,
        data,
    } satisfies ApiResponse<T>)
}

export const sendError = (res: Response, status: number, message: string) => {
    return sendResponse(res, status, message, false, {})
}
