import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

export async function getFeed(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const tagId = req.query.tagId as string | undefined;
    const sourceId = req.query.sourceId as string | undefined;

    const where: Record<string, unknown> = {};
    if (sourceId) {
      where.sourceId = sourceId;
    }
    if (tagId) {
      where.tags = {
        some: {
          tagId,
        },
      };
    }

    const articles = await prisma.article.findMany({
      where,
      skip: offset,
      take: limit,
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
        _count: {
          select: {
            favorites: true,
            reports: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    const total = await prisma.article.count({ where });

    const formattedArticles = articles.map((article: typeof articles[0]) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      url: article.url,
      publishedAt: article.publishedAt,
      source: article.source,
      tags: article.tags.map((at: typeof article.tags[0]) => at.tag),
      favoritesCount: article._count.favorites,
      reportsCount: article._count.reports,
    }));

    return res.json({
      status: 'ok',
      data: {
        articles: formattedArticles,
        pagination: {
          total,
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    logger.error('Get feed error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to fetch feed',
      },
    });
  }
}

export async function getArticle(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            url: true,
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
        _count: {
          select: {
            favorites: true,
            reports: true,
          },
        },
      },
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

    const formattedArticle = {
      id: article.id,
      title: article.title,
      content: article.content,
      url: article.url,
      publishedAt: article.publishedAt,
      source: article.source,
      tags: article.tags.map((at: typeof article.tags[0]) => at.tag),
      favoritesCount: article._count.favorites,
      reportsCount: article._count.reports,
    };

    return res.json({
      status: 'ok',
      data: formattedArticle,
    });
  } catch (error) {
    logger.error('Get article error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to fetch article',
      },
    });
  }
}
