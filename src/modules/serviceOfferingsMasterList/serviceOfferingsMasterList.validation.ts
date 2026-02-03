import { z } from 'zod';

export const createServiceOfferingMasterListSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
  }),
});

export const updateServiceOfferingMasterListSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255).optional(),
    description: z.string().optional(),
  }),
});
