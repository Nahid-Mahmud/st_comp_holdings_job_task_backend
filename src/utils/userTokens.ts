import { StatusCodes } from 'http-status-codes';

import { generateJwtToken, verifyJwtToken } from './jwt';
import envVariables from '../config/env';
import AppError from '../errors/AppError';
import { prisma } from '../config/prisma';
import { UserRole } from '@prisma/client';

export const generateAuthTokens = (user: {
  id: string;
  email: string;
  role: UserRole;
}) => {
  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateJwtToken(
    jwtPayload,
    envVariables.JWT.ACCESS_TOKEN_JWT_SECRET,
    envVariables.JWT.ACCESS_TOKEN_JWT_EXPIRATION
  );

  const refreshToken = generateJwtToken(
    jwtPayload,
    envVariables.JWT.REFRESH_TOKEN_JWT_SECRET,
    envVariables.JWT.REFRESH_TOKEN_JWT_EXPIRATION
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const createNewRefreshToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Refresh token is required');
  }

  let decodedToken;
  try {
    decodedToken = verifyJwtToken(
      refreshToken,
      envVariables.JWT.REFRESH_TOKEN_JWT_SECRET
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('jwt expired')) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Token has expired');
    }
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  //  check if user exists
  const userId = decodedToken.id as string | undefined;
  const userEmail = decodedToken.email as string | undefined;

  if (!userId || !userEmail) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      email: userEmail,
    },
  });
  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User account not found');
  }

  // check if user is blocked or deleted

  const newAccessToken = generateJwtToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    envVariables.JWT.ACCESS_TOKEN_JWT_SECRET,
    envVariables.JWT.ACCESS_TOKEN_JWT_EXPIRATION
  );
  return newAccessToken;
};
