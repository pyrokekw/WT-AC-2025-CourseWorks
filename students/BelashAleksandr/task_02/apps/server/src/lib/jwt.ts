import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

function assertSecrets() {
  if (!ACCESS_SECRET || !REFRESH_SECRET) {
    throw new Error('JWT secrets are not configured');
  }
}

export function generateAccessToken(payload: JwtPayload): string {
  assertSecrets();
  return jwt.sign(payload as unknown as object, ACCESS_SECRET!, {
    expiresIn: ACCESS_EXPIRATION,
  });
}

export function generateRefreshToken(payload: JwtPayload): string {
  assertSecrets();
  return jwt.sign(payload as unknown as object, REFRESH_SECRET!, {
    expiresIn: REFRESH_EXPIRATION,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  assertSecrets();
  return jwt.verify(token, ACCESS_SECRET!) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  assertSecrets();
  return jwt.verify(token, REFRESH_SECRET!) as JwtPayload;
}
