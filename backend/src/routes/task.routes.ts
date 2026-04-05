import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { createTaskSchema, updateTaskSchema, taskQuerySchema, taskIdParamSchema } from '../schemas/task.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All task routes require authentication
router.use(asyncHandler(authMiddleware));

router.get('/', validate(taskQuerySchema, 'query'), asyncHandler(taskController.list));
router.post('/', validate(createTaskSchema), asyncHandler(taskController.create));
router.get('/:id', validate(taskIdParamSchema, 'params'), asyncHandler(taskController.getById));
router.patch('/:id', validate(taskIdParamSchema, 'params'), validate(updateTaskSchema), asyncHandler(taskController.update));
router.delete('/:id', validate(taskIdParamSchema, 'params'), asyncHandler(taskController.remove));
router.patch('/:id/toggle', validate(taskIdParamSchema, 'params'), asyncHandler(taskController.toggle));

export default router;
