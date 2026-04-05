import { Request, Response } from 'express';
import * as taskService from '../services/task.service';

export async function list(req: Request, res: Response): Promise<void> {
  const result = await taskService.listTasks(req.userId!, req.query as any);
  res.status(200).json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const task = await taskService.createTask(req.userId!, req.body);
  res.status(201).json(task);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const task = await taskService.getTaskById(req.userId!, req.params.id);
  res.status(200).json(task);
}

export async function update(req: Request, res: Response): Promise<void> {
  const task = await taskService.updateTask(req.userId!, req.params.id, req.body);
  res.status(200).json(task);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await taskService.deleteTask(req.userId!, req.params.id);
  res.status(200).json({ message: 'Task deleted successfully' });
}

export async function toggle(req: Request, res: Response): Promise<void> {
  const task = await taskService.toggleTaskStatus(req.userId!, req.params.id);
  res.status(200).json(task);
}
