import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

export async function getSources(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const sources = await prisma.source.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.source.count();

    return res.json({
      status: 'ok',
      data: {
        sources,
        pagination: {
          total,
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    logger.error('Get sources error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to fetch sources',
      },
    });
  }
}

export async function getSource(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const source = await prisma.source.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!source) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'not_found',
          message: 'Source not found',
        },
      });
    }

    return res.json({
      status: 'ok',
      data: source,
    });
  } catch (error) {
    logger.error('Get source error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to fetch source',
      },
    });
  }
}

export async function createSource(req: Request, res: Response) {
  try {
    const { name, url, description } = req.body;

    const source = await prisma.source.create({
      data: {
        name,
        url,
        description,
      },
    });

    logger.info(`Source created: ${name}`);

    return res.status(201).json({
      status: 'ok',
      data: source,
    });
  } catch (error) {
    logger.error('Create source error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to create source',
      },
    });
  }
}

export async function updateSource(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, url, description } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (description !== undefined) updateData.description = description;

    const source = await prisma.source.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Source updated: ${id}`);

    return res.json({
      status: 'ok',
      data: source,
    });
  } catch (error) {
    logger.error('Update source error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to update source',
      },
    });
  }
}

export async function deleteSource(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.source.delete({
      where: { id },
    });

    logger.info(`Source deleted: ${id}`);

    return res.json({
      status: 'ok',
      data: { message: 'Source deleted successfully' },
    });
  } catch (error) {
    logger.error('Delete source error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to delete source',
      },
    });
  }
}
