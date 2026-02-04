import { z } from 'zod';

export const createSpecialistSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: z.string().min(1, 'Description is required'),
    base_price: z.number().positive('Base price must be positive'),
    duration_days: z
      .number()
      .int()
      .positive('Duration must be a positive integer'),
    is_draft: z.boolean().optional(),
    service_offerings_master_list_ids: z
      .array(z.string().uuid('Invalid service offering ID'))
      .optional(),
    display_order: z
      .array(z.number().int().min(0))
      .length(3, 'Must provide exactly 3 display orders')
      .optional(),
  }),
});

export const updateSpecialistSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title too long')
      .optional(),
    slug: z.string().min(1, 'Slug is required').optional(),
    description: z.string().min(1, 'Description is required').optional(),
    base_price: z.number().positive('Base price must be positive').optional(),
    duration_days: z
      .number()
      .int()
      .positive('Duration must be a positive integer')
      .optional(),
    is_draft: z.boolean().optional(),
    verification_status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    is_verified: z.boolean().optional(),
    deleted_media_ids: z.array(z.string().uuid('Invalid media ID')).optional(),
    display_order: z.array(z.number().int().min(0)).optional(),
  }),
});

export const querySpecialistsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    is_draft: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    verification_status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    is_verified: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
  }),
});
