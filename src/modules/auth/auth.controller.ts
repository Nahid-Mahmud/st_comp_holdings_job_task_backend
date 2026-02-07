import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { generateAuthTokens } from "../../utils/userTokens";
import { authService } from "./auth.service";

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  const { accessToken, refreshToken } = generateAuthTokens({ id: result.id, email: result.email });

  res.cookie("refreshToken", refreshToken, { httpOnly: true });
  res.cookie("accessToken", accessToken, { httpOnly: true });

  sendResponse(res, {
    success: true,
    message: "User logged in successfully",
    data: { user: result, accessToken, refreshToken },
    statusCode: 200,
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgetPassword(email);

  sendResponse(res, {
    success: true,
    message: result.message,
    data: result,
    statusCode: 200,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPassword(token, newPassword);

  sendResponse(res, {
    success: true,
    message: result.message,
    data: result,
    statusCode: 200,
  });
});

export const authController = {
  login,
  forgetPassword,
  resetPassword,
};
