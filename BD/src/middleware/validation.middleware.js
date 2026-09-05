import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

/**
 * Generic Zod validation middleware factory.
 * Usage: validateRequest(schema, 'body') or validateRequest(schema, 'query')
 */
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : req.body;
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      return next(new ApiError(400, `Invalid input data: ${JSON.stringify(errors)}`));
    }

    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'query') {
      req.query = result.data;
    }

    next();
  };
};

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'merchant', 'admin']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  price: z.number().min(0, 'Price must be a positive number'),
  category: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  status: z
    .enum(['DRAFT', 'ACTIVE', 'ARCHIVED'])
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  technicalSpecs: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  inventory: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  shipping: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});
