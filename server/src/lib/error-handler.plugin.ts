import type { NextFunction, Request, Response } from 'express';
import { ExpressError } from '../lib/express-error.js';

export const errorHandlerPlugin = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) return next(err);

  const statusCode = err instanceof ExpressError ? err.code : 500;

  if (statusCode >= 400) {
    res.locals.error = err;

    res.status(statusCode).json({
      message: err.message,
    });
  }
};
