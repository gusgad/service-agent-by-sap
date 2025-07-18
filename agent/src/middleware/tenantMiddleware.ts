import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  tenant: string;
}

export const extractTenant = (req: Request, res: Response, next: NextFunction): void => {
  const tenant = req.headers['x-tenant-id'] as string || 'default';
  (req as AuthenticatedRequest).tenant = tenant;
  next();
};