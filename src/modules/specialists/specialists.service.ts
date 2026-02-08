import type { Prisma } from '@prisma/client';
import { MediaType, MimeType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import {
  uploadFileToCloudinary,
  deleteFileFormCloudinary,
} from '../../config/cloudinary.config';
import slugify from 'slugify';

// Prisma type for specialist with relations
type SpecialistWithRelations = Prisma.SpecialistsGetPayload<{
  include: {
    service_offerings: {
      include: {
        service_offerings_master_list: true;
      };
    };
    media: true;
  };
}>;

interface CreateSpecialistInput {
  title: string;
  description: string;
  base_price: number;
  duration_days: number;
  is_draft?: boolean;
  service_offerings_master_list_ids?: string[];
  display_order?: number[];
}

type UpdateSpecialistInput = Partial<
  Pick<
    Prisma.SpecialistsUpdateInput,
    | 'title'
    | 'slug'
    | 'description'
    | 'is_draft'
    | 'verification_status'
    | 'is_verified'
  >
> & {
  base_price?: number;
  duration_days?: number;
  deleted_media_ids?: string[];
  display_order?: number[];
  service_offerings_master_list_ids?: string[];
};

interface QuerySpecialistsInput {
  page?: number | string;
  limit?: number | string;
  search?: string;
  is_draft?: boolean | string;
  verification_status?: Prisma.EnumVerificationStatusFilter;
  is_verified?: boolean | string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Calculate platform fee based on base price
const calculatePlatformFee = async (basePrice: number): Promise<number> => {
  const platformFees = await prisma.platformFee.findMany({
    orderBy: {
      min_value: 'asc',
    },
  });

  for (const fee of platformFees) {
    if (basePrice >= fee.min_value && basePrice <= fee.max_value) {
      return (basePrice * Number(fee.platform_fee_percentage)) / 100;
    }
  }

  // Default to 0 if no matching tier found
  return 0;
};

// Create a new specialist
const createSpecialist = async (
  input: CreateSpecialistInput,
  files?: Express.Multer.File[]
): Promise<SpecialistWithRelations> => {
  const {
    title,
    description,
    base_price,
    duration_days,
    is_draft = true,
    service_offerings_master_list_ids = [],
    display_order = [0, 1, 2],
  } = input;

  // Generate slug from title
  const slug = slugify(title, { lower: true, strict: true });

  // Check if slug already exists
  const existingSpecialist = await prisma.specialists.findUnique({
    where: { slug },
  });

  if (existingSpecialist) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Specialist with slug "${slug}" already exists`
    );
  }

  // Calculate platform fee and final price
  const platform_fee = await calculatePlatformFee(base_price);
  const final_price = base_price + platform_fee;

  // Validate service offering master list IDs if provided
  if (service_offerings_master_list_ids.length > 0) {
    const validMasterLists = await prisma.serviceOfferingMasterList.findMany({
      where: {
        id: {
          in: service_offerings_master_list_ids,
        },
      },
    });

    if (validMasterLists.length !== service_offerings_master_list_ids.length) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'One or more service offering master list IDs are invalid'
      );
    }
  }

  // Upload files to Cloudinary if provided
  let uploadedFiles: {
    public_id: string;
    secure_url: string;
    size: number;
    mimetype: string;
  }[] = [];
  if (files && files.length > 0) {
    try {
      const uploadPromises = files.map((file) =>
        uploadFileToCloudinary(file, 'service-images')
      );
      const results = await Promise.all(uploadPromises);
      uploadedFiles = results.map((result, index) => ({
        public_id: result.public_id,
        secure_url: result.secure_url,
        size: files[index].size,
        mimetype: files[index].mimetype,
      }));
    } catch (error) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Map mime types
  const mimeTypeMapping: Record<string, MimeType> = {
    'image/png': MimeType.IMAGE_PNG,
    'image/jpeg': MimeType.IMAGE_JPEG,
    'image/jpg': MimeType.IMAGE_JPEG,
    'image/webp': MimeType.IMAGE_WEBP,
  };

  // Create specialist with service offerings and media
  const specialist = await prisma.specialists.create({
    data: {
      title,
      slug,
      description,
      base_price,
      platform_fee,
      final_price,
      duration_days,
      is_draft,
      service_offerings: {
        create: service_offerings_master_list_ids.map((masterListId) => ({
          service_offerings_master_list_id: masterListId,
        })),
      },
      media: {
        create: uploadedFiles.map((file, index) => {
          const mime_type = mimeTypeMapping[file.mimetype];
          if (!mime_type) {
            throw new AppError(
              StatusCodes.BAD_REQUEST,
              'Unsupported file type. Only PNG, JPEG, and WEBP images are allowed.'
            );
          }
          return {
            file_name: file.secure_url,
            file_size: file.size,
            display_order: display_order[index] ?? index,
            mime_type,
            media_type: MediaType.SERVICE_IMAGE,
          };
        }),
      },
    },
    include: {
      service_offerings: {
        include: {
          service_offerings_master_list: true,
        },
      },
      media: {
        where: {
          deleted_at: null,
        },
        orderBy: {
          display_order: 'asc',
        },
      },
    },
  });

  return specialist;
};

// Get all specialists with pagination and filters
const getAllSpecialists = async (
  query: QuerySpecialistsInput
): Promise<PaginatedResponse<SpecialistWithRelations>> => {
  const {
    page = 1,
    limit = 10,
    search,
    is_draft,
    verification_status,
    is_verified,
  } = query;

  // Parse numeric parameters (in case they come as strings from query params)
  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;

  const skip = (parsedPage - 1) * parsedLimit;

  // Build where clause
  const where: Prisma.SpecialistsWhereInput = {
    deleted_at: null,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Parse boolean parameters (in case they come as strings from query params)
  if (is_draft !== undefined) {
    const parsedIsDraft =
      typeof is_draft === 'string' ? is_draft === 'true' : is_draft;
    where.is_draft = parsedIsDraft;
  }

  if (verification_status) {
    where.verification_status = verification_status;
  }

  if (is_verified !== undefined) {
    const parsedIsVerified =
      typeof is_verified === 'string' ? is_verified === 'true' : is_verified;
    where.is_verified = parsedIsVerified;
  }

  // Get specialists and total count
  const [specialists, total] = await Promise.all([
    prisma.specialists.findMany({
      where,
      skip,
      take: parsedLimit,
      include: {
        service_offerings: {
          include: {
            service_offerings_master_list: true,
          },
        },
        media: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            display_order: 'asc',
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    }),
    prisma.specialists.count({ where }),
  ]);

  return {
    data: specialists,
    meta: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

// Get a single specialist by ID
const getSpecialistById = async (
  id: string
): Promise<SpecialistWithRelations> => {
  const specialist = await prisma.specialists.findUnique({
    where: { id },
    include: {
      service_offerings: {
        include: {
          service_offerings_master_list: true,
        },
      },
      media: {
        where: {
          deleted_at: null,
        },
        orderBy: {
          display_order: 'asc',
        },
      },
    },
  });

  if (!specialist || specialist.deleted_at) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  return specialist;
};

// Get a single specialist by slug
const getSpecialistBySlug = async (
  slug: string
): Promise<SpecialistWithRelations> => {
  const specialist = await prisma.specialists.findUnique({
    where: { slug },
    include: {
      service_offerings: {
        include: {
          service_offerings_master_list: true,
        },
      },
      media: {
        where: {
          deleted_at: null,
        },
        orderBy: {
          display_order: 'asc',
        },
      },
    },
  });

  if (!specialist || specialist.deleted_at) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  return specialist;
};

// Update a specialist
const updateSpecialist = async (
  id: string,
  input: UpdateSpecialistInput,
  files?: Express.Multer.File[]
): Promise<SpecialistWithRelations> => {
  const existingSpecialist = await prisma.specialists.findUnique({
    where: { id },
    include: {
      media: {
        where: {
          deleted_at: null,
        },
      },
    },
  });

  if (!existingSpecialist || existingSpecialist.deleted_at) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  // Check if slug is being changed and if it's unique
  if (
    input.slug &&
    typeof input.slug === 'string' &&
    input.slug !== existingSpecialist.slug
  ) {
    const slugExists = await prisma.specialists.findUnique({
      where: { slug: input.slug },
    });

    if (slugExists) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Specialist with slug "${input.slug}" already exists`
      );
    }
  }

  // Handle deleted media
  if (input.deleted_media_ids && input.deleted_media_ids.length > 0) {
    // Get media files to delete from Cloudinary
    const mediaToDelete = await prisma.media.findMany({
      where: {
        id: {
          in: input.deleted_media_ids,
        },
        specialist_id: id,
        deleted_at: null,
      },
    });

    if (mediaToDelete.length !== input.deleted_media_ids.length) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'One or more media IDs are invalid or already deleted'
      );
    }

    // Delete files from Cloudinary
    const deletePromises = mediaToDelete.map((media) =>
      deleteFileFormCloudinary(media.file_name).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to delete file from Cloudinary: ${media.file_name}`,
          error
        );
        // Continue even if Cloudinary deletion fails
      })
    );
    await Promise.all(deletePromises);

    // Soft delete media records from database
    await prisma.media.updateMany({
      where: {
        id: {
          in: input.deleted_media_ids,
        },
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  // Handle new file uploads
  if (files && files.length > 0) {
    // Upload files to Cloudinary
    let uploadedFiles: {
      public_id: string;
      secure_url: string;
      size: number;
      mimetype: string;
    }[] = [];

    try {
      const uploadPromises = files.map((file) =>
        uploadFileToCloudinary(file, 'service-images')
      );
      const results = await Promise.all(uploadPromises);
      uploadedFiles = results.map((result, index) => ({
        public_id: result.public_id,
        secure_url: result.secure_url,
        size: files[index].size,
        mimetype: files[index].mimetype,
      }));
    } catch (error) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Map mime types
    const mimeTypeMapping: Record<string, MimeType> = {
      'image/png': MimeType.IMAGE_PNG,
      'image/jpeg': MimeType.IMAGE_JPEG,
      'image/jpg': MimeType.IMAGE_JPEG,
      'image/webp': MimeType.IMAGE_WEBP,
    };

    // Get the highest display_order from existing media
    const existingMediaCount = existingSpecialist.media.length;
    const deletedCount = input.deleted_media_ids?.length || 0;
    const startingDisplayOrder = existingMediaCount - deletedCount;

    // Create new media records
    const mediaCreateData = uploadedFiles.map((file, index) => {
      const mime_type = mimeTypeMapping[file.mimetype];
      if (!mime_type) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'Unsupported file type. Only PNG, JPEG, and WEBP images are allowed.'
        );
      }
      return {
        specialist_id: id,
        file_name: file.secure_url,
        file_size: file.size,
        display_order:
          input.display_order && input.display_order[index] !== undefined
            ? input.display_order[index]
            : startingDisplayOrder + index,
        mime_type,
        media_type: MediaType.SERVICE_IMAGE,
      };
    });

    await prisma.media.createMany({
      data: mediaCreateData,
    });
  }

  // Handle service offerings update
  if (input.service_offerings_master_list_ids !== undefined) {
    // Validate master list IDs if provided
    if (input.service_offerings_master_list_ids.length > 0) {
      const validMasterLists = await prisma.serviceOfferingMasterList.findMany({
        where: {
          id: {
            in: input.service_offerings_master_list_ids,
          },
        },
      });

      if (
        validMasterLists.length !==
        input.service_offerings_master_list_ids.length
      ) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'One or more service offering master list IDs are invalid'
        );
      }
    }

    // Delete all existing service offerings
    await prisma.serviceOffering.deleteMany({
      where: {
        specialist_id: id,
      },
    });

    // Create new service offerings if any provided
    if (input.service_offerings_master_list_ids.length > 0) {
      await prisma.serviceOffering.createMany({
        data: input.service_offerings_master_list_ids.map((masterListId) => ({
          specialist_id: id,
          service_offerings_master_list_id: masterListId,
        })),
      });
    }
  }

  // If base_price is being updated, recalculate platform fee and final price
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    deleted_media_ids,
    display_order,
    service_offerings_master_list_ids,
    ...restInput
  } = input;
  let updateData: Prisma.SpecialistsUpdateInput = { ...restInput };

  if (input.base_price) {
    const platform_fee = await calculatePlatformFee(input.base_price);
    const final_price = input.base_price + platform_fee;
    updateData = {
      ...updateData,
      platform_fee,
      final_price,
    };
  }

  const specialist = await prisma.specialists.update({
    where: { id },
    data: updateData,
    include: {
      service_offerings: {
        include: {
          service_offerings_master_list: true,
        },
      },
      media: {
        where: {
          deleted_at: null,
        },
        orderBy: {
          display_order: 'asc',
        },
      },
    },
  });

  return specialist;
};

// Soft delete a specialist
const deleteSpecialist = async (
  id: string
): Promise<Prisma.SpecialistsGetPayload<Record<string, never>>> => {
  const existingSpecialist = await prisma.specialists.findUnique({
    where: { id },
  });

  if (!existingSpecialist || existingSpecialist.deleted_at) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  const specialist = await prisma.specialists.update({
    where: { id },
    data: {
      deleted_at: new Date(),
    },
  });

  return specialist;
};

// Add service offerings to a specialist
const addServiceOfferings = async (
  specialistId: string,
  masterListIds: string[]
): Promise<SpecialistWithRelations> => {
  const specialist = await prisma.specialists.findUnique({
    where: { id: specialistId },
  });

  if (!specialist || specialist.deleted_at) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  // Validate master list IDs
  const validMasterLists = await prisma.serviceOfferingMasterList.findMany({
    where: {
      id: {
        in: masterListIds,
      },
    },
  });

  if (validMasterLists.length !== masterListIds.length) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'One or more service offering master list IDs are invalid'
    );
  }

  // Get existing service offerings
  const existingOfferings = await prisma.serviceOffering.findMany({
    where: {
      specialist_id: specialistId,
    },
  });

  const existingMasterListIds = existingOfferings.map(
    (offering) => offering.service_offerings_master_list_id
  );

  // Filter out IDs that already exist
  const newMasterListIds = masterListIds.filter(
    (id) => !existingMasterListIds.includes(id)
  );

  if (newMasterListIds.length === 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'All service offerings already exist for this specialist'
    );
  }

  // Create new service offerings
  await prisma.serviceOffering.createMany({
    data: newMasterListIds.map((masterListId) => ({
      specialist_id: specialistId,
      service_offerings_master_list_id: masterListId,
    })),
  });

  // Return updated specialist
  const updatedSpecialist = await prisma.specialists.findUnique({
    where: { id: specialistId },
    include: {
      service_offerings: {
        include: {
          service_offerings_master_list: true,
        },
      },
      media: {
        where: {
          deleted_at: null,
        },
        orderBy: {
          display_order: 'asc',
        },
      },
    },
  });

  if (!updatedSpecialist) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  return updatedSpecialist;
};

// Remove service offerings from a specialist
const removeServiceOfferings = async (
  specialistId: string,
  masterListIds: string[]
): Promise<SpecialistWithRelations> => {
  const specialist = await prisma.specialists.findUnique({
    where: { id: specialistId },
  });

  if (!specialist || specialist.deleted_at) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  // Delete service offerings
  await prisma.serviceOffering.deleteMany({
    where: {
      specialist_id: specialistId,
      service_offerings_master_list_id: {
        in: masterListIds,
      },
    },
  });

  // Return updated specialist
  const updatedSpecialist = await prisma.specialists.findUnique({
    where: { id: specialistId },
    include: {
      service_offerings: {
        include: {
          service_offerings_master_list: true,
        },
      },
      media: {
        where: {
          deleted_at: null,
        },
        orderBy: {
          display_order: 'asc',
        },
      },
    },
  });

  if (!updatedSpecialist) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  return updatedSpecialist;
};

export const SpecialistsService = {
  createSpecialist,
  getAllSpecialists,
  getSpecialistById,
  getSpecialistBySlug,
  updateSpecialist,
  deleteSpecialist,
  addServiceOfferings,
  removeServiceOfferings,
};
