import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    (req as AuthenticatedRequest).userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
