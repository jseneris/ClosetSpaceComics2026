import { auth } from 'express-oauth2-jwt-bearer';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { prisma } from '../prismaClient';
import { NotAuthorizedError } from '../errors/not-authorized-error';

// Validates the Auth0-issued JWT bearer token on every protected route.
export const requireAuth = auth({
  issuerBaseURL: `https://${env.auth0.domain}/`,
  audience: env.auth0.audience,
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUserId?: number;
    }
  }
}

// Resolves the Auth0 `sub` claim to our internal User row, creating one on
// first sign-in. Replaces the legacy `userId` request header / FirebaseId lookup.
export async function attachCurrentUser(req: Request, _res: Response, next: NextFunction) {
  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) {
    throw new NotAuthorizedError();
  }

  const user = await prisma.user.upsert({
    where: { auth0Id },
    update: {},
    create: { auth0Id },
  });

  req.currentUserId = user.id;
  next();
}
