import dotenv from 'dotenv';

dotenv.config();

interface EnvVariables {
  PORT: string;
  DATABASE_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  FRONTEND_URL: string;
  TEST_DB_URI?: string;
  BCRYPT_SALT_ROUNDS: string;
  JWT: {
    ACCESS_TOKEN_JWT_SECRET: string;
    ACCESS_TOKEN_JWT_EXPIRATION: string;
    REFRESH_TOKEN_JWT_SECRET: string;
    REFRESH_TOKEN_JWT_EXPIRATION: string;
    FORGET_PASSWORD_TOKEN_JWT_SECRET: string;
    FORGET_PASSWORD_TOKEN_JWT_EXPIRATION: string;
  };
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
}

const loadEnvVariable = (): EnvVariables => {
  const requiredEnvVariables = [
    'PORT',
    'DATABASE_URL',
    'NODE_ENV',
    'FRONTEND_URL',
    'BCRYPT_SALT_ROUNDS',
    'ACCESS_TOKEN_JWT_SECRET',
    'ACCESS_TOKEN_JWT_EXPIRATION',
    'REFRESH_TOKEN_JWT_SECRET',
    'REFRESH_TOKEN_JWT_EXPIRATION',
    'FORGET_PASSWORD_TOKEN_JWT_SECRET',
    'FORGET_PASSWORD_TOKEN_JWT_EXPIRATION',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });

  let databaseUrl = process.env.DATABASE_URL as string;

  if (process.env.NODE_ENV === 'test') {
    if (!process.env.TEST_DB_URI) {
      throw new Error('Missing required environment variable: TEST_DB_URI');
    }
    databaseUrl = process.env.TEST_DB_URI as string;
  }

  return {
    PORT: process.env.PORT as string,
    DATABASE_URL: databaseUrl,
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS as string,
    JWT: {
      ACCESS_TOKEN_JWT_SECRET: process.env.ACCESS_TOKEN_JWT_SECRET as string,
      ACCESS_TOKEN_JWT_EXPIRATION: process.env
        .ACCESS_TOKEN_JWT_EXPIRATION as string,
      REFRESH_TOKEN_JWT_SECRET: process.env.REFRESH_TOKEN_JWT_SECRET as string,
      REFRESH_TOKEN_JWT_EXPIRATION: process.env
        .REFRESH_TOKEN_JWT_EXPIRATION as string,
      FORGET_PASSWORD_TOKEN_JWT_SECRET: process.env
        .FORGET_PASSWORD_TOKEN_JWT_SECRET as string,
      FORGET_PASSWORD_TOKEN_JWT_EXPIRATION: process.env
        .FORGET_PASSWORD_TOKEN_JWT_EXPIRATION as string,
    },
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    },
  };
};

const envVariables = loadEnvVariable();
export default envVariables;
