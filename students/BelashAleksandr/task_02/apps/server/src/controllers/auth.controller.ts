import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../lib/jwt';
import logger from '../lib/logger';

const isProduction = process.env.NODE_ENV === 'production';

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth/refresh',
  });
}

export async function register(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'user_exists',
          message: 'Username already exists',
          fields: { username: 'This username is already taken' },
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: 'user',
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    logger.info(`New user registered: ${username}`);

    return res.status(201).json({
      status: 'ok',
      data: user,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to register user',
      },
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'invalid_credentials',
          message: 'Invalid username or password',
        },
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'invalid_credentials',
          message: 'Invalid username or password',
        },
      });
    }

    // Generate tokens
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setRefreshCookie(res, refreshToken);

    logger.info(`User logged in: ${username}`);

    return res.json({
      status: 'ok',
      data: {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to log in',
      },
    });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.cookies as { refreshToken?: string };

    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'unauthorized',
          message: 'Refresh token missing',
        },
      });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      clearRefreshCookie(res);
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'invalid_token',
          message: 'Invalid or expired refresh token',
        },
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    });

    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    });

    setRefreshCookie(res, newRefreshToken);

    return res.json({
      status: 'ok',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    return res.status(401).json({
      status: 'error',
      error: {
        code: 'invalid_token',
        message: 'Invalid or expired refresh token',
      },
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.cookies as { refreshToken?: string };

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await prisma.user.update({
          where: { id: payload.userId },
          data: { tokenVersion: { increment: 1 } },
        });
      } catch (err) {
        logger.warn('Logout token invalid or already expired', err);
      }
    }

    clearRefreshCookie(res);

    return res.json({
      status: 'ok',
      data: { message: 'Logged out' },
    });
  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to logout',
      },
    });
  }
}
