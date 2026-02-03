import { Router } from 'express';
import { PlatformFeeController } from './platformFee.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createPlatformFeeSchema,
  updatePlatformFeeSchema,
} from './platformFee.validation';

export const platformFeeRouter: Router = Router();

// Create a new platform fee
platformFeeRouter.post(
  '/',
  validateRequest(createPlatformFeeSchema),
  PlatformFeeController.createPlatformFee
);

// Get all platform fees
platformFeeRouter.get('/', PlatformFeeController.getAllPlatformFees);

// Get a single platform fee by ID
platformFeeRouter.get('/:id', PlatformFeeController.getPlatformFeeById);

// Update a platform fee
platformFeeRouter.patch(
  '/:id',
  validateRequest(updatePlatformFeeSchema),
  PlatformFeeController.updatePlatformFee
);

// Delete a platform fee
platformFeeRouter.delete('/:id', PlatformFeeController.deletePlatformFee);
