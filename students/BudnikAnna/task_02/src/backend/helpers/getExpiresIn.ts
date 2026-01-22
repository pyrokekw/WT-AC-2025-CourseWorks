import { SignOptions } from 'jsonwebtoken'

export const getExpiresIn = (): SignOptions['expiresIn'] => {
    const v = process.env.JWT_EXPIRES_IN
    if (!v) return '7d'
    if (/^\d+$/.test(v)) return Number(v) // секунды
    return v as SignOptions['expiresIn'] // "7d", "1h" и т.п.
}
