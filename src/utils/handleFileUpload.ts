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

export const handleMultipleFileUpload = async (
  files: Express.Multer.File[],
  folder: string
): Promise<string[]> => {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

  try {
    const uploadPromises = files.map((file) =>
      uploadFileToCloudinary(file, folder)
    );
    const uploadResults = await Promise.all(uploadPromises);
    return uploadResults.map((result) => result.secure_url);
  } catch (error) {
    throw new Error(
      `Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
