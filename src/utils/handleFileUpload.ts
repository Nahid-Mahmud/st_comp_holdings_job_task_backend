import { uploadFileToCloudinary } from '../config/cloudinary.config';

export const handleSingleFileUpload = async (
  file: Express.Multer.File | undefined,
  folder: string
): Promise<string> => {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const uploadResult = await uploadFileToCloudinary(file, folder);
    return uploadResult.secure_url;
  } catch (error) {
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
