import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';

// ! get current user profile
const getMe = async (email: string) => {
  if (!email) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Email is required');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return user;
};

export const userService = {
  getMe,
};
