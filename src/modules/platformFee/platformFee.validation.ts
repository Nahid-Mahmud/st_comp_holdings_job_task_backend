import { z } from 'zod';

export const createPlatformFeeSchema = z.object({
  body: z
    .object({
      tier_name: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
      min_value: z.number().int().nonnegative(),
      max_value: z.number().int().positive(),
      platform_fee_percentage: z.number().min(0).max(100),
    })
    .refine((data) => data.max_value >= data.min_value, {
      message: 'max_value must be greater than or equal to min_value',
      path: ['max_value'],
    }),
});

export const updatePlatformFeeSchema = z.object({
  body: z
    .object({
      tier_name: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
      min_value: z.number().int().nonnegative().optional(),
      max_value: z.number().int().positive().optional(),
      platform_fee_percentage: z.number().min(0).max(100).optional(),
    })
    .refine(
      (data) => {
        if (data.min_value !== undefined && data.max_value !== undefined) {
          return data.max_value >= data.min_value;
        }
        return true;
      },
      {
        message: 'max_value must be greater than or equal to min_value',
        path: ['max_value'],
      }
    ),
});
