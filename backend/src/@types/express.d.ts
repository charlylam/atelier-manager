import type { UserRole } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    // Renseigné par le middleware authenticate à partir du JWT.
    user?: { userId: number; workshopId: number; role: UserRole };
  }
}
