import type { Prisma, ServiceOfferingMasterList } from '@prisma/client';
import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import {
  deleteFileFormCloudinary,
  uploadFileToCloudinary,
} from '../../config/cloudinary.config';

import { buildCloudinarySecureUrl } from '../../utils/cloudinaryUrl';

interface CreateServiceOfferingInput {
  title: string;
  description?: string;
  file?: Express.Multer.File;
}

interface UpdateServiceOfferingInput {
  title?: string;
  description?: string;
  file?: Express.Multer.File;
}

interface CreateServiceOfferingResult extends ServiceOfferingMasterList {
  secure_url?: string;
}

// Create a new service offering master list with file upload
const createServiceOfferingMasterList = async (
  input: CreateServiceOfferingInput
): Promise<CreateServiceOfferingResult> => {
  const { title, description, file } = input;
  const bucket_name = 'service-offerings';

  let s3_key: string | undefined;
  let secureUrl: string | undefined;

  // Handle file upload if present
  if (file) {
    try {
      const uploadResult = await uploadFileToCloudinary(file, bucket_name);

      s3_key = uploadResult.public_id;
      secureUrl = uploadResult.secure_url;
    } catch (error) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  try {
    const serviceOffering = await prisma.$transaction(async (tx) => {
      // throw test error
      //   throw new Error('Test error');
      return tx.serviceOfferingMasterList.create({
        data: {
          title,
          description,
          s3_key,
          bucket_name,
        },
      });
    });

    return {
      ...serviceOffering,
      secure_url: secureUrl,
    };
  } catch (error) {
    if (secureUrl) {
      try {
        await deleteFileFormCloudinary(secureUrl);
      } catch (cleanupError) {
        // eslint-disable-next-line no-console
        console.error(
          'Failed to delete uploaded file after DB error:',
          cleanupError
        );
      }
    }

    throw error;
  }
};

// Get all service offering master lists
const getAllServiceOfferingMasterLists = async (): Promise<
  ServiceOfferingMasterList[]
> => {
  const serviceOfferings = await prisma.serviceOfferingMasterList.findMany({
    orderBy: {
      created_at: 'desc',
    },
  });

  const serviceOfferingsWithUrls =
    serviceOfferings.map((so) => {
      let secure_url: string | undefined = undefined;
      if (so.s3_key) {
        secure_url = buildCloudinarySecureUrl(so.s3_key);
      }
      return {
        ...so,
        secure_url,
      };
    }) || [];

  return serviceOfferingsWithUrls;
};

// Get a single service offering master list by ID
const getServiceOfferingMasterListById = async (
  id: string
): Promise<ServiceOfferingMasterList | null> => {
  const serviceOffering = await prisma.serviceOfferingMasterList.findUnique({
    where: { id },
    include: {
      offerings: true,
    },
  });

  if (!serviceOffering) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Service offering master list not found'
    );
  }

  const serviceOfferingWithUrl = {
    ...serviceOffering,
    secure_url: serviceOffering.s3_key
      ? buildCloudinarySecureUrl(serviceOffering.s3_key)
      : undefined,
  };

  return serviceOfferingWithUrl;
};

// Update a service offering master list with optional file upload
const updateServiceOfferingMasterList = async (
  id: string,
  input: UpdateServiceOfferingInput
): Promise<ServiceOfferingMasterList> => {
  const { title, description, file } = input;

  const existingOffering = await prisma.serviceOfferingMasterList.findUnique({
    where: { id },
  });

  if (!existingOffering) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Service offering master list not found'
    );
  }

  const updateData: Prisma.ServiceOfferingMasterListUpdateInput = {
    title,
    description,
  };

  // Handle file upload if present
  if (file) {
    try {
      const uploadResult = await uploadFileToCloudinary(
        file,
        existingOffering.bucket_name
      );

      // Delete old file from Cloudinary if it exists
      if (existingOffering.s3_key) {
        try {
          // construct full public_id with extension
          const secureUrl = buildCloudinarySecureUrl(existingOffering.s3_key);
          if (secureUrl) {
            await deleteFileFormCloudinary(secureUrl);
          }
        } catch (error) {
          console.error('Failed to delete old file:', error);
          // Continue anyway, don't throw error
        }
      }

      // Update with new s3_key
      updateData.s3_key = uploadResult.public_id;
    } catch (error) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  const serviceOffering = await prisma.serviceOfferingMasterList.update({
    where: { id },
    data: updateData,
  });

  return serviceOffering;
};

// Delete a service offering master list with file cleanup
const deleteServiceOfferingMasterList = async (
  id: string
): Promise<ServiceOfferingMasterList> => {
  const existingOffering = await prisma.serviceOfferingMasterList.findUnique({
    where: { id },
  });

  if (!existingOffering) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Service offering master list not found'
    );
  }

  // Delete file from Cloudinary if it exists
  if (existingOffering.s3_key) {
    try {
      await deleteFileFormCloudinary(existingOffering.s3_key);
    } catch (error) {
      console.error('Failed to delete file:', error);
      // Continue anyway, don't throw error
    }
  }

  const serviceOffering = await prisma.serviceOfferingMasterList.delete({
    where: { id },
  });

  return serviceOffering;
};

export const ServiceOfferingsMasterListService = {
  createServiceOfferingMasterList,
  getAllServiceOfferingMasterLists,
  getServiceOfferingMasterListById,
  updateServiceOfferingMasterList,
  deleteServiceOfferingMasterList,
};
