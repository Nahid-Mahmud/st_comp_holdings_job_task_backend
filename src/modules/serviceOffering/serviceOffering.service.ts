import type { ServiceOffering } from '@prisma/client';
import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

// Create a service offering for a specialist
const createServiceOfferings = async (input: {
  specialist_id: string;
  service_offerings_master_list_id: string;
}): Promise<ServiceOffering> => {
  const { specialist_id, service_offerings_master_list_id } = input;

  // Validate specialist exists
  const specialist = await prisma.specialists.findUnique({
    where: { id: specialist_id },
  });

  if (!specialist) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  // Validate service offering master list ID exists
  const masterList = await prisma.serviceOfferingMasterList.findUnique({
    where: { id: service_offerings_master_list_id },
  });

  if (!masterList) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      `Service offering master list not found: ${service_offerings_master_list_id}`
    );
  }

  // Check for existing service offering to avoid duplicates
  const existingOffering = await prisma.serviceOffering.findFirst({
    where: {
      specialist_id,
      service_offerings_master_list_id,
    },
  });

  if (existingOffering) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Service offering already exists for this specialist with this master list ID`
    );
  }

  // Create service offering with master list ID
  const serviceOffering = await prisma.serviceOffering.create({
    data: {
      specialist_id,
      service_offerings_master_list_id,
    },
    include: {
      specialist: true,
      service_offerings_master_list: true,
    },
  });

  return serviceOffering;
};

// Get all service offerings for a specialist
const getServiceOfferingsBySpecialistId = async (
  specialist_id: string
): Promise<ServiceOffering[]> => {
  const specialist = await prisma.specialists.findUnique({
    where: { id: specialist_id },
  });

  if (!specialist) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  const serviceOfferings = await prisma.serviceOffering.findMany({
    where: { specialist_id },
    include: {
      specialist: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return serviceOfferings;
};

// Get a single service offering by ID
const getServiceOfferingById = async (
  id: string
): Promise<ServiceOffering | null> => {
  const serviceOffering = await prisma.serviceOffering.findUnique({
    where: { id },
    include: {
      specialist: true,
    },
  });

  if (!serviceOffering) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Service offering not found');
  }

  return serviceOffering;
};

// Delete a service offering
const deleteServiceOffering = async (id: string): Promise<ServiceOffering> => {
  const serviceOffering = await prisma.serviceOffering.findUnique({
    where: { id },
  });

  if (!serviceOffering) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Service offering not found');
  }

  const deletedServiceOffering = await prisma.serviceOffering.delete({
    where: { id },
  });

  return deletedServiceOffering;
};

// Delete a specific service offering for a specialist
const deleteServiceOfferingsBySpecialistId = async (
  specialist_id: string,
  service_offerings_master_list_id: string
): Promise<number> => {
  const specialist = await prisma.specialists.findUnique({
    where: { id: specialist_id },
  });

  if (!specialist) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  const result = await prisma.serviceOffering.deleteMany({
    where: {
      specialist_id,
      service_offerings_master_list_id,
    },
  });

  return result.count;
};

// Get all service offerings
const getAllServiceOfferings = async (): Promise<ServiceOffering[]> => {
  const serviceOfferings = await prisma.serviceOffering.findMany({
    include: {
      specialist: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return serviceOfferings;
};

export const ServiceOfferingService = {
  createServiceOfferings,
  getServiceOfferingsBySpecialistId,
  getServiceOfferingById,
  deleteServiceOffering,
  deleteServiceOfferingsBySpecialistId,
  getAllServiceOfferings,
};
