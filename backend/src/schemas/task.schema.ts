import { z } from 'zod';

export const TaskStatus = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);
export const TaskPriority = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(2000).optional(),
  status: TaskStatus.optional().default('TODO'),
  priority: TaskPriority.optional().default('MEDIUM'),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: TaskStatus.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'title']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const taskIdParamSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
