import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SpecialistsService } from './specialists.service';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';

// Create a new specialist
const createSpecialist = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'At least 1 photo is required');
  }

  const specialist = await SpecialistsService.createSpecialist(req.body, files);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Specialist created successfully',
    data: specialist,
  });
});

// Get all specialists
const getAllSpecialists = catchAsync(async (req: Request, res: Response) => {
  const result = await SpecialistsService.getAllSpecialists(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Specialists retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

// Get a single specialist by ID
const getSpecialistById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const specialist = await SpecialistsService.getSpecialistById(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Specialist retrieved successfully',
    data: specialist,
  });
});

// Get a single specialist by slug
const getSpecialistBySlug = catchAsync(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const specialist = await SpecialistsService.getSpecialistBySlug(slug);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Specialist retrieved successfully',
    data: specialist,
  });
});

// Update a specialist
const updateSpecialist = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const files = req.files as Express.Multer.File[] | undefined;
  const specialist = await SpecialistsService.updateSpecialist(
    id,
    req.body,
    files
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Specialist updated successfully',
    data: specialist,
  });
});

// Delete a specialist
const deleteSpecialist = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const specialist = await SpecialistsService.deleteSpecialist(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Specialist deleted successfully',
    data: specialist,
  });
});

// Add service offerings to a specialist
const addServiceOfferings = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { master_list_ids } = req.body;

  const specialist = await SpecialistsService.addServiceOfferings(
    id,
    master_list_ids
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Service offerings added successfully',
    data: specialist,
  });
});

// Remove service offerings from a specialist
const removeServiceOfferings = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { master_list_ids } = req.body;

    const specialist = await SpecialistsService.removeServiceOfferings(
      id,
      master_list_ids
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Service offerings removed successfully',
      data: specialist,
    });
  }
);

export const SpecialistsController = {
  createSpecialist,
  getAllSpecialists,
  getSpecialistById,
  getSpecialistBySlug,
  updateSpecialist,
  deleteSpecialist,
  addServiceOfferings,
  removeServiceOfferings,
};
