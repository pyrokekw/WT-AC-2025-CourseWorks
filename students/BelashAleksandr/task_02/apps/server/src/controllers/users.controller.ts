import { Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const users = await prisma.user.findMany({
      skip: offset,
      take: limit,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.user.count();

    return res.json({
      status: 'ok',
      data: {
        users,
        pagination: {
          total,
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to fetch users',
      },
    });
  }
}

export async function getUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // Check if user is accessing their own data or is admin
    if (req.user?.role !== 'admin' && req.user?.userId !== id) {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'forbidden',
          message: 'You can only access your own user data',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'not_found',
          message: 'User not found',
        },
      });
    }

    return res.json({
      status: 'ok',
      data: user,
    });
  } catch (error) {
    logger.error('Get user error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to fetch user',
      },
    });
  }
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { username, password, role } = req.body;

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

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role || 'user',
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    logger.info(`User created by admin: ${username}`);

    return res.status(201).json({
      status: 'ok',
      data: user,
    });
  } catch (error) {
    logger.error('Create user error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to create user',
      },
    });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    // Check if user is updating their own data or is admin
    if (req.user?.role !== 'admin' && req.user?.userId !== id) {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'forbidden',
          message: 'You can only update your own user data',
        },
      });
    }

    // Non-admins cannot change roles
    if (req.user?.role !== 'admin' && role) {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'forbidden',
          message: 'Only administrators can change user roles',
        },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (username) updateData.username = username;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10);
    if (role && req.user?.role === 'admin') updateData.role = role;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        updatedAt: true,
      },
    });

    logger.info(`User updated: ${id}`);

    return res.json({
      status: 'ok',
      data: user,
    });
  } catch (error) {
    logger.error('Update user error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to update user',
      },
    });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    logger.info(`User deleted: ${id}`);

    return res.json({
      status: 'ok',
      data: { message: 'User deleted successfully' },
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to delete user',
      },
    });
  }
}
