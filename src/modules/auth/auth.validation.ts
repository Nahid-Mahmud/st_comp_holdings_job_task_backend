import { z } from "zod";

const loginValidationSchema = z.object({
  email: z.email().min(1, "Email is required").toLowerCase(),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters long"),
});

const forgetPasswordValidationSchema = z.object({
  email: z.email().min(1, "Email is required").toLowerCase(),
});

const resetPasswordValidationSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(1, "New password is required")
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password is too long"),
});

export const authValidation = {
  loginValidationSchema,
  forgetPasswordValidationSchema,
  resetPasswordValidationSchema,
};
