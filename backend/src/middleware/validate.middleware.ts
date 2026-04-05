import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const errors = issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      _res.status(400).json({ message: 'Validation error', errors });
      return;
    }

    (req as any)[target] = result.data;
    next();
  };
}
