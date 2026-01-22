import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'moderator', 'user']).optional(),
});

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores')
    .optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['admin', 'moderator', 'user']).optional(),
});

export const createSourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Invalid URL format'),
  description: z.string().optional(),
});

export const updateSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  url: z.string().url('Invalid URL format').optional(),
  description: z.string().optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const updateTagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const createFavoriteSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
});

export const createReportSchema = z.object({
  articleId: z.string().uuid('Invalid article ID'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export const updateReportSchema = z.object({
  status: z.enum(['new', 'reviewed', 'closed']),
});
