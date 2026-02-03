import envVariables from '../config/env';

export const buildCloudinarySecureUrl = (
  publicId?: string | null
): string | undefined => {
  if (!publicId) {
    return undefined;
  }

  const extension = publicId.split('.').pop();

  //   `https://res.cloudinary.com/${envVariables.CLOUDINARY.CLOUDINARY_CLOUD_NAME}/image/upload/${serviceOffering.s3_key}.${extension}`

  return `https://res.cloudinary.com/${envVariables.CLOUDINARY.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}.${extension}`;
};
