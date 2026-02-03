import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ServiceOfferingsMasterListService } from './serviceOfferingsMasterList.service';
import { StatusCodes } from 'http-status-codes';

// Create a new service offering master list with file upload
const createServiceOfferingMasterList = catchAsync(
  async (req: Request, res: Response) => {
    const { title, description } = req.body;
    const file = req.file;

    const serviceOffering =
      await ServiceOfferingsMasterListService.createServiceOfferingMasterList({
        title,
        description,
        file,
      });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Service offering master list created successfully',
      data: serviceOffering,
    });
  }
);

// Get all service offering master lists
const getAllServiceOfferingMasterLists = catchAsync(
  async (_req: Request, res: Response) => {
    const serviceOfferings =
      await ServiceOfferingsMasterListService.getAllServiceOfferingMasterLists();

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Service offering master lists retrieved successfully',
      data: serviceOfferings,
    });
  }
);

// Get a single service offering master list by ID
const getServiceOfferingMasterListById = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceOffering =
      await ServiceOfferingsMasterListService.getServiceOfferingMasterListById(
        id
      );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Service offering master list retrieved successfully',
      data: serviceOffering,
    });
  }
);

// Update a service offering master list with optional file upload
const updateServiceOfferingMasterList = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, description } = req.body;
    const file = req.file;

    const serviceOffering =
      await ServiceOfferingsMasterListService.updateServiceOfferingMasterList(
        id,
        {
          title,
          description,
          file,
        }
      );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Service offering master list updated successfully',
      data: serviceOffering,
    });
  }
);

// Delete a service offering master list
const deleteServiceOfferingMasterList = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const serviceOffering =
      await ServiceOfferingsMasterListService.deleteServiceOfferingMasterList(
        id
      );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Service offering master list deleted successfully',
      data: serviceOffering,
    });
  }
);

export const ServiceOfferingsMasterListController = {
  createServiceOfferingMasterList,
  getAllServiceOfferingMasterLists,
  getServiceOfferingMasterListById,
  updateServiceOfferingMasterList,
  deleteServiceOfferingMasterList,
};
