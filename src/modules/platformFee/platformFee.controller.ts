import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PlatformFeeService } from './platformFee.service';
import { StatusCodes } from 'http-status-codes';

// Create a new platform fee
const createPlatformFee = catchAsync(async (req: Request, res: Response) => {
  const platformFee = await PlatformFeeService.createPlatformFee(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Platform fee created successfully',
    data: platformFee,
  });
});

// Get all platform fees
const getAllPlatformFees = catchAsync(async (req: Request, res: Response) => {
  const platformFees = await PlatformFeeService.getAllPlatformFees();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Platform fees retrieved successfully',
    data: platformFees,
  });
});

// Get a single platform fee by ID
const getPlatformFeeById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const platformFee = await PlatformFeeService.getPlatformFeeById(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Platform fee retrieved successfully',
    data: platformFee,
  });
});

// Update a platform fee
const updatePlatformFee = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const platformFee = await PlatformFeeService.updatePlatformFee(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Platform fee updated successfully',
    data: platformFee,
  });
});

// Delete a platform fee
const deletePlatformFee = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const platformFee = await PlatformFeeService.deletePlatformFee(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Platform fee deleted successfully',
    data: platformFee,
  });
});

export const PlatformFeeController = {
  createPlatformFee,
  getAllPlatformFees,
  getPlatformFeeById,
  updatePlatformFee,
  deletePlatformFee,
};
