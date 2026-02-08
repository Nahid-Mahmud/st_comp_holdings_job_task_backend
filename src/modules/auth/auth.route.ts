import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { authValidation } from './auth.validation';

const router = Router();

router.post(
  '/register',
  validateRequest(authValidation.registerValidationSchema),
  authController.register
);
router.post(
  '/login',
  validateRequest(authValidation.loginValidationSchema),
  authController.login
);
router.post(
  '/forget-password',
  validateRequest(authValidation.forgetPasswordValidationSchema),
  authController.forgetPassword
);
router.post(
  '/reset-password',
  validateRequest(authValidation.resetPasswordValidationSchema),
  authController.resetPassword
);

router.post(
  '/refresh-token',
  authController.generateAccessTokenFromRefreshToken
);

router.post('/logout', authController.logout);

export const authRoutes = router;
