import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

export async function getFavorites(req: AuthRequest, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const userId = req.user!.userId;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      skip: offset,
      take: limit,
      include: {
        article: {
          include: {
            source: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.favorite.count({ where: { userId } });

    const formattedFavorites = favorites.map((fav: typeof favorites[0]) => ({
      id: fav.id,
      createdAt: fav.createdAt,
      article: {
        id: fav.article.id,
        title: fav.article.title,
        content: fav.article.content,
        url: fav.article.url,
        publishedAt: fav.article.publishedAt,
        source: fav.article.source,
        tags: fav.article.tags.map((at: typeof fav.article.tags[0]) => at.tag),
      },
    }));

    return res.json({
      status: 'ok',
      data: {
        favorites: formattedFavorites,
        pagination: {
          total,
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    logger.error('Get favorites error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to fetch favorites',
      },
    });
  }
}

export async function createFavorite(req: AuthRequest, res: Response) {
  try {
    const { articleId } = req.body;
    const userId = req.user!.userId;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'not_found',
          message: 'Article not found',
        },
      });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findFirst({
      where: {
        userId,
        articleId,
      },
    });

    if (existing) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'already_favorited',
          message: 'Article is already in favorites',
        },
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        articleId,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    logger.info(`Favorite created: user=${userId}, article=${articleId}`);

    return res.status(201).json({
      status: 'ok',
      data: favorite,
    });
  } catch (error) {
    logger.error('Create favorite error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to add to favorites',
      },
    });
  }
}

export async function deleteFavorite(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if favorite exists and belongs to user
    const favorite = await prisma.favorite.findUnique({
      where: { id },
    });

    if (!favorite) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'not_found',
          message: 'Favorite not found',
        },
      });
    }

    if (favorite.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'forbidden',
          message: 'You can only delete your own favorites',
        },
      });
    }

    await prisma.favorite.delete({
      where: { id },
    });

    logger.info(`Favorite deleted: ${id}`);

    return res.json({
      status: 'ok',
      data: { message: 'Favorite deleted successfully' },
    });
  } catch (error) {
    logger.error('Delete favorite error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to delete favorite',
      },
    });
  }
}
