import { Request, Response } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
}

export const errorHandler = (err: ErrorWithStatus, req: Request, res: Response): void => {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal Server Error' : err.message;
  
  if (status === 500) {
    console.error('Server error:', err);
  }
  
  res.status(status).json({
    error: message
  });
};