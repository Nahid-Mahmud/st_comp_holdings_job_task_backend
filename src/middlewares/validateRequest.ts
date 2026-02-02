import type { NextFunction, Request, Response } from 'express';
import { ZodObject, type ZodRawShape } from 'zod';

export const validateRequest =
  (ZodSchema: ZodObject<ZodRawShape>) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.body.data) {
        req.body = JSON.parse(req.body.data);
      }

      req.body = await ZodSchema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
