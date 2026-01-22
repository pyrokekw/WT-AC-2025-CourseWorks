import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

export async function getReports(req: AuthRequest, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const reports = await prisma.report.findMany({
      where,
      skip: offset,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.report.count({ where });

    return res.json({
      status: 'ok',
      data: {
        reports,
        pagination: {
          total,
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to fetch reports',
      },
    });
  }
}

export async function getReport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
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
    });

    if (!report) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'not_found',
          message: 'Report not found',
        },
      });
    }

    return res.json({
      status: 'ok',
      data: report,
    });
  } catch (error) {
    logger.error('Get report error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to fetch report',
      },
    });
  }
}

export async function createReport(req: AuthRequest, res: Response) {
  try {
    const { articleId, reason } = req.body;
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

    // Check if user already reported this article
    const existingReport = await prisma.report.findFirst({
      where: {
        userId,
        articleId,
        status: { in: ['new', 'reviewed'] },
      },
    });

    if (existingReport) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'already_reported',
          message: 'You have already reported this article',
        },
      });
    }

    const report = await prisma.report.create({
      data: {
        userId,
        articleId,
        reason,
        status: 'new',
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

    logger.info(`Report created: user=${userId}, article=${articleId}`);

    return res.status(201).json({
      status: 'ok',
      data: report,
    });
  } catch (error) {
    logger.error('Create report error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to create report',
      },
    });
  }
}

export async function updateReport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await prisma.report.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    logger.info(`Report updated: ${id}, new status: ${status}`);

    return res.json({
      status: 'ok',
      data: report,
    });
  } catch (error) {
    logger.error('Update report error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to update report',
      },
    });
  }
}
