import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function requireRole(allowedRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role !== allowedRole) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        message: `Forbidden. This resource is reserved for ${allowedRole.toLowerCase()}s.`,
      });
    }

    next();
  };
}
