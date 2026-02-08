import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { userService } from './user.service';

const getMe = catchAsync(async (req, res) => {
  const userEmail = req.user.email;
  const result = await userService.getMe(userEmail);

  sendResponse(res, {
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
    statusCode: 200,
  });
});

export const userController = {
  getMe,
};
