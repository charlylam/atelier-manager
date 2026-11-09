import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ConflictError, UnauthorizedError } from '../lib/errors.js';
import {
  loginBodySchema,
  registerBodySchema,
} from '../validators/auth.validator.js';

// Hash vérifié quand l'e-mail est inconnu : le temps de réponse ne révèle
// pas si le compte existe.
const DUMMY_HASH = await argon2.hash('mot-de-passe-factice');

export async function registerUser(req: Request, res: Response) {
  const data = registerBodySchema.parse(req.body);
  const passwordHash = await argon2.hash(data.password);

  try {
    // L'atelier et son administrateur sont créés ensemble, ou pas du tout.
    const user = await prisma.$transaction(async (tx) => {
      const workshop = await tx.workshop.create({
        data: { name: data.workshopName },
      });

      return tx.user.create({
        data: {
          workshopId: workshop.id,
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: UserRole.admin,
        },
        // Limite les données renvoyées au frontend.
        select: {
          id: true,
          workshopId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });

    return res
      .status(201)
      .json({ message: 'Account created successfully', user });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictError('Email or workshop name already in use');
    }
    throw error;
  }
}

export async function loginUser(req: Request, res: Response) {
  const { email, password } = loginBodySchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });

  const isPasswordValid = await argon2.verify(
    user?.passwordHash ?? DUMMY_HASH,
    password
  );

  if (!user || !isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const jwtSecret = process.env.JWT_SECRET as Secret;
  const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '1d') as NonNullable<
    SignOptions['expiresIn']
  >;

  // Le payload est relu par le middleware authenticate.
  const token = jwt.sign(
    { userId: user.id, workshopId: user.workshopId, role: user.role },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

  return res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      workshopId: user.workshopId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  });
}

// Le JWT est sans état : la déconnexion consiste à supprimer le cookie côté Next.js.
export async function logoutUser(_req: Request, res: Response) {
  return res.status(200).json({ message: 'Logout successful' });
}

export async function getCurrentUser(req: Request, res: Response) {
  const { userId, workshopId } = req.user!;

  // Relecture en base : le rôle renvoyé est le rôle actuel, pas celui du jeton.
  const user = await prisma.user.findFirst({
    where: { id: userId, workshopId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      workshop: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    throw new UnauthorizedError('User no longer exists');
  }

  return res.status(200).json({ data: user });
}
