import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

export async function getTags(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const tags = await prisma.tag.findMany({
      skip: offset,
      take: limit,
      include: {
        _count: {
          select: { articles: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const total = await prisma.tag.count();

    return res.json({
      status: 'ok',
      data: {
        tags,
        pagination: {
          total,
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    logger.error('Get tags error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to fetch tags',
      },
    });
  }
}

export async function getTag(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!tag) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'not_found',
          message: 'Tag not found',
        },
      });
    }

    return res.json({
      status: 'ok',
      data: tag,
    });
  } catch (error) {
    logger.error('Get tag error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to fetch tag',
      },
    });
  }
}

export async function createTag(req: Request, res: Response) {
  try {
    const { name } = req.body;

    const existingTag = await prisma.tag.findUnique({
      where: { name },
    });

    if (existingTag) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'tag_exists',
          message: 'Tag already exists',
          fields: { name: 'This tag name is already taken' },
        },
      });
    }

    const tag = await prisma.tag.create({
      data: { name },
    });

    logger.info(`Tag created: ${name}`);

    return res.status(201).json({
      status: 'ok',
      data: tag,
    });
  } catch (error) {
    logger.error('Create tag error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to create tag',
      },
    });
  }
}

export async function updateTag(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const tag = await prisma.tag.update({
      where: { id },
      data: { name },
    });

    logger.info(`Tag updated: ${id}`);

    return res.json({
      status: 'ok',
      data: tag,
    });
  } catch (error) {
    logger.error('Update tag error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to update tag',
      },
    });
  }
}

export async function deleteTag(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.tag.delete({
      where: { id },
    });

    logger.info(`Tag deleted: ${id}`);

    return res.json({
      status: 'ok',
      data: { message: 'Tag deleted successfully' },
    });
  } catch (error) {
    logger.error('Delete tag error:', error);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 'internal_server_error',
        message: 'Failed to delete tag',
      },
    });
  }
}
