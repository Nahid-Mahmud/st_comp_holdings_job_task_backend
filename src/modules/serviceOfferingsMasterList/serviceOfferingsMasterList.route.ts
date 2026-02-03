import { Router } from 'express';
import { ServiceOfferingsMasterListController } from './serviceOfferingsMasterList.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createServiceOfferingMasterListSchema,
  updateServiceOfferingMasterListSchema,
} from './serviceOfferingsMasterList.validation';
import { multerUpload } from '../../config/multer.config';

export const serviceOfferingsMasterListRouter: Router = Router();

// Create a new service offering master list with optional file upload
serviceOfferingsMasterListRouter.post(
  '/',
  multerUpload.single('file'),
  validateRequest(createServiceOfferingMasterListSchema),
  ServiceOfferingsMasterListController.createServiceOfferingMasterList
);

// Get all service offering master lists
serviceOfferingsMasterListRouter.get(
  '/',
  ServiceOfferingsMasterListController.getAllServiceOfferingMasterLists
);

// Get a single service offering master list by ID
serviceOfferingsMasterListRouter.get(
  '/:id',
  ServiceOfferingsMasterListController.getServiceOfferingMasterListById
);

// Update a service offering master list with optional file upload
serviceOfferingsMasterListRouter.patch(
  '/:id',
  multerUpload.single('file'),
  validateRequest(updateServiceOfferingMasterListSchema),
  ServiceOfferingsMasterListController.updateServiceOfferingMasterList
);

// Delete a service offering master list
serviceOfferingsMasterListRouter.delete(
  '/:id',
  ServiceOfferingsMasterListController.deleteServiceOfferingMasterList
);
