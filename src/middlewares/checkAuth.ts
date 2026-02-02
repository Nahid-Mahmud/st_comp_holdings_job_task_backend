import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '@prisma/client';
import envVariables from '../config/env';
import AppError from '../errors/AppError';
import { verifyJwtToken } from '../utils/jwt';
import { prisma } from '../config/prisma';

export const checkAuth =
  (...authRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization || req.cookies.accessToken;
      if (!accessToken) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          'Access token is required'
        );
      }
      const verifiedToken = verifyJwtToken(
        accessToken,
        envVariables.JWT.ACCESS_TOKEN_JWT_SECRET
      );

      const isUserExist = await prisma.user.findUnique({
        where: { email: verifiedToken.email },
      });

      if (!isUserExist) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User does not exist');
      }

      if (isUserExist.status === 'suspended') {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          'Your account has been suspended'
        );
      }

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          'You do not have permission to access this resource'
        );
      }

      req.user = verifiedToken;

      next();
    } catch (error) {
      next(error);
    }
  };
