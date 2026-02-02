import { StatusCodes } from 'http-status-codes';

import { generateJwtToken, verifyJwtToken } from './jwt';
import envVariables from '../config/env';
import AppError from '../errors/AppError';
import { prisma } from '../config/prisma';

export const generateAuthTokens = (user: { id: string; email: string }) => {
  const jwtPayload = {
    id: user.id,
    email: user.email,
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

  const decodedToken = verifyJwtToken(
    refreshToken,
    envVariables.JWT.REFRESH_TOKEN_JWT_SECRET
  );

  //  check if user exists
  const user = await prisma.user.findUnique({
    where: {
      id: decodedToken.userId,
    },
  });
  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User account not found');
  }

  // check if user is blocked or deleted

  const newAccessToken = generateJwtToken(
    {
      userId: user.id,
      email: user.email,
    },
    envVariables.JWT.ACCESS_TOKEN_JWT_SECRET,
    envVariables.JWT.ACCESS_TOKEN_JWT_EXPIRATION
  );
  return newAccessToken;
};
