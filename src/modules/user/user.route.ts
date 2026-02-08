import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { checkAuth } from '../../middlewares/checkAuth';
import { userController } from './user.controller';

const router = Router();

router.get(
  '/me',
  checkAuth(...Object.values(UserRole)), // Allow all roles to access their profile
  userController.getMe
);

export const userRoutes = router;
