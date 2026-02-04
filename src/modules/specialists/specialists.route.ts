import { Router } from 'express';
import { SpecialistsController } from './specialists.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { multerUpload } from '../../config/multer.config';
import {
  createSpecialistSchema,
  updateSpecialistSchema,
  querySpecialistsSchema,
} from './specialists.validation';

export const specialistsRouter: Router = Router();

// Create a new specialist
specialistsRouter.post(
  '/',
  multerUpload.array('photos', 3),
  validateRequest(createSpecialistSchema),
  SpecialistsController.createSpecialist
);

// Get all specialists with pagination and filters
specialistsRouter.get(
  '/',
  validateRequest(querySpecialistsSchema),
  SpecialistsController.getAllSpecialists
);

// Get a single specialist by slug
specialistsRouter.get('/slug/:slug', SpecialistsController.getSpecialistBySlug);

// Get a single specialist by ID
specialistsRouter.get('/:id', SpecialistsController.getSpecialistById);

// Update a specialist
specialistsRouter.patch(
  '/:id',
  multerUpload.array('photos', 3),
  validateRequest(updateSpecialistSchema),
  SpecialistsController.updateSpecialist
);

// Delete a specialist (soft delete)
specialistsRouter.delete('/:id', SpecialistsController.deleteSpecialist);

// Add service offerings to a specialist
specialistsRouter.post(
  '/:id/service-offerings',
  SpecialistsController.addServiceOfferings
);

// Remove service offerings from a specialist
specialistsRouter.delete(
  '/:id/service-offerings',
  SpecialistsController.removeServiceOfferings
);
