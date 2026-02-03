import type { Prisma, PlatformFee } from '@prisma/client';
import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

// Create a new platform fee
const createPlatformFee = async (
  data: Prisma.PlatformFeeCreateInput
): Promise<PlatformFee> => {
  // Check for overlapping tiers
  const existingFee = await prisma.platformFee.findFirst({
    where: {
      tier_name: data.tier_name,
    },
  });

  if (existingFee) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Platform fee for tier ${data.tier_name} already exists`
    );
  }

  const platformFee = await prisma.platformFee.create({
    data,
  });

  return platformFee;
};

// Get all platform fees
const getAllPlatformFees = async (): Promise<PlatformFee[]> => {
  const platformFees = await prisma.platformFee.findMany({
    orderBy: {
      created_at: 'asc',
    },
  });
  return platformFees;
};

// Get a single platform fee by ID
const getPlatformFeeById = async (id: string): Promise<PlatformFee | null> => {
  const platformFee = await prisma.platformFee.findUnique({
    where: { id },
  });

  if (!platformFee) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Platform fee not found');
  }

  return platformFee;
};

// Update a platform fee
const updatePlatformFee = async (
  id: string,
  data: Prisma.PlatformFeeUpdateInput
): Promise<PlatformFee> => {
  const existingFee = await prisma.platformFee.findUnique({
    where: { id },
  });

  if (!existingFee) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Platform fee not found');
  }

  const platformFee = await prisma.platformFee.update({
    where: { id },
    data,
  });
  return platformFee;
};

// Delete a platform fee
const deletePlatformFee = async (id: string): Promise<PlatformFee> => {
  const existingFee = await prisma.platformFee.findUnique({
    where: { id },
  });

  if (!existingFee) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Platform fee not found');
  }

  const platformFee = await prisma.platformFee.delete({
    where: { id },
  });
  return platformFee;
};

export const PlatformFeeService = {
  createPlatformFee,
  getAllPlatformFees,
  getPlatformFeeById,
  updatePlatformFee,
  deletePlatformFee,
};
