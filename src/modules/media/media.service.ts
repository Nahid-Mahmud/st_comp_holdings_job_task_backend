import type { Prisma, Media } from '@prisma/client';
import { MediaType, MimeType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import {
  deleteFileFormCloudinary,
  uploadFileToCloudinary,
} from '../../config/cloudinary.config';
import { buildCloudinarySecureUrl } from '../../utils/cloudinaryUrl';

// Create a new media with file upload
const createMedia = async (
  specialist_id: string,
  file: Express.Multer.File,
  media_type: MediaType,
  display_order = 0
): Promise<Media & { secure_url: string }> => {
  // Verify specialist exists
  const specialist = await prisma.specialists.findUnique({
    where: { id: specialist_id },
  });

  if (!specialist) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Specialist not found');
  }

  // Determine bucket name based on media type
  const bucket_name =
    media_type === MediaType.PROFILE_IMAGE
      ? 'profile-images'
      : 'service-images';

  // Map file mime type to our enum
  const mimeTypeMapping: Record<string, MimeType> = {
    'image/png': MimeType.IMAGE_PNG,
    'image/jpeg': MimeType.IMAGE_JPEG,
    'image/webp': MimeType.IMAGE_WEBP,
  };

  const mime_type = mimeTypeMapping[file.mimetype];
  if (!mime_type) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Unsupported file type. Only PNG, JPEG, and WEBP images are allowed.'
    );
  }

  let cloudinaryResult;
  try {
    cloudinaryResult = await uploadFileToCloudinary(file, bucket_name);
  } catch (error) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Create media record
  const media = await prisma.media.create({
    data: {
      specialist_id,
      file_name: cloudinaryResult.public_id,
      file_size: file.size,
      display_order,
      mime_type,
      media_type,
    },
  });

  return {
    ...media,
    secure_url: cloudinaryResult.secure_url,
  };
};

// Get all media for a specialist
const getMediaBySpecialistId = async (
  specialist_id: string
): Promise<(Media & { secure_url: string })[]> => {
  const mediaList = await prisma.media.findMany({
    where: {
      specialist_id,
      deleted_at: null,
    },
    orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
  });

  return mediaList.map((media) => ({
    ...media,
    secure_url: buildCloudinarySecureUrl(media.file_name) || '',
  }));
};

// Get media by ID
const getMediaById = async (
  id: string
): Promise<(Media & { secure_url: string }) | null> => {
  const media = await prisma.media.findUnique({
    where: {
      id,
      deleted_at: null,
    },
    include: {
      specialist: true,
    },
  });

  if (!media) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Media not found');
  }

  return {
    ...media,
    secure_url: buildCloudinarySecureUrl(media.file_name) || '',
  };
};

// Update media
const updateMedia = async (
  id: string,
  input: Prisma.MediaUpdateInput & { file?: Express.Multer.File }
): Promise<Media & { secure_url: string }> => {
  const existingMedia = await prisma.media.findUnique({
    where: {
      id,
      deleted_at: null,
    },
  });

  if (!existingMedia) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Media not found');
  }

  let updateData: Prisma.MediaUpdateInput = {};
  let newFileUrl: string | undefined;

  // Handle file replacement
  if (input.file) {
    const bucket_name =
      existingMedia.media_type === MediaType.PROFILE_IMAGE
        ? 'profile-images'
        : 'service-images';

    // Map file mime type to our enum
    const mimeTypeMapping: Record<string, MimeType> = {
      'image/png': MimeType.IMAGE_PNG,
      'image/jpeg': MimeType.IMAGE_JPEG,
      'image/webp': MimeType.IMAGE_WEBP,
    };

    const mime_type = mimeTypeMapping[input.file.mimetype];
    if (!mime_type) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Unsupported file type. Only PNG, JPEG, and WEBP images are allowed.'
      );
    }

    try {
      // Upload new file
      const uploadResult = await uploadFileToCloudinary(
        input.file,
        bucket_name
      );

      // Delete old file from cloudinary
      if (existingMedia.file_name) {
        await deleteFileFormCloudinary(existingMedia.file_name);
      }

      updateData = {
        ...updateData,
        file_name: uploadResult.public_id,
        file_size: input.file.size,
        mime_type,
      };
      newFileUrl = uploadResult.secure_url;
    } catch (error) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Handle other updates
  if (input.display_order !== undefined) {
    updateData.display_order = input.display_order;
  }
  if (input.media_type !== undefined) {
    updateData.media_type = input.media_type;
  }

  const updatedMedia = await prisma.media.update({
    where: { id },
    data: updateData,
  });

  return {
    ...updatedMedia,
    secure_url:
      newFileUrl || buildCloudinarySecureUrl(updatedMedia.file_name) || '',
  };
};

// Soft delete media
const deleteMedia = async (id: string): Promise<Media> => {
  const existingMedia = await prisma.media.findUnique({
    where: {
      id,
      deleted_at: null,
    },
  });

  if (!existingMedia) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Media not found');
  }

  // Soft delete the media record
  const deletedMedia = await prisma.media.update({
    where: { id },
    data: {
      deleted_at: new Date(),
    },
  });

  // Optionally delete from cloudinary as well
  try {
    if (existingMedia.file_name) {
      await deleteFileFormCloudinary(existingMedia.file_name);
    }
  } catch {
    // Log error but don't fail the operation
  }

  return deletedMedia;
};

// Hard delete media (permanently delete)
const hardDeleteMedia = async (id: string): Promise<void> => {
  const existingMedia = await prisma.media.findUnique({
    where: { id },
  });

  if (!existingMedia) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Media not found');
  }

  // Delete from cloudinary first
  try {
    if (existingMedia.file_name) {
      await deleteFileFormCloudinary(existingMedia.file_name);
    }
  } catch {
    // Failed to delete file from cloudinary - continue with database deletion
  }

  // Permanently delete from database
  await prisma.media.delete({
    where: { id },
  });
};

// Update display order for multiple media items
const updateDisplayOrder = async (
  mediaUpdates: { id: string; display_order: number }[]
): Promise<(Media & { secure_url: string })[]> => {
  // Validate all media exist and belong to same specialist
  const mediaIds = mediaUpdates.map((update) => update.id);
  const existingMedia = await prisma.media.findMany({
    where: {
      id: { in: mediaIds },
      deleted_at: null,
    },
  });

  if (existingMedia.length !== mediaUpdates.length) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'One or more media items not found'
    );
  }

  // Check if all media belong to same specialist
  const specialistIds = [
    ...new Set(existingMedia.map((media) => media.specialist_id)),
  ];
  if (specialistIds.length > 1) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'All media items must belong to the same specialist'
    );
  }

  // Update display orders
  await prisma.$transaction(
    mediaUpdates.map((update) =>
      prisma.media.update({
        where: { id: update.id },
        data: { display_order: update.display_order },
      })
    )
  );

  // Return updated media list for the specialist
  return getMediaBySpecialistId(specialistIds[0]);
};

// Get media by type for a specialist
const getMediaByType = async (
  specialist_id: string,
  media_type: MediaType
): Promise<(Media & { secure_url: string })[]> => {
  const mediaList = await prisma.media.findMany({
    where: {
      specialist_id,
      media_type,
      deleted_at: null,
    },
    orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
  });

  return mediaList.map((media) => ({
    ...media,
    secure_url: buildCloudinarySecureUrl(media.file_name) || '',
  }));
};

export const MediaService = {
  createMedia,
  getMediaBySpecialistId,
  getMediaById,
  updateMedia,
  deleteMedia,
  hardDeleteMedia,
  updateDisplayOrder,
  getMediaByType,
};
