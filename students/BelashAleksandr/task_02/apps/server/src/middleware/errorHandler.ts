import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    status: 'error',
    error: {
      code: 'internal_server_error',
      message: 'An unexpected error occurred',
    },
  });
}
