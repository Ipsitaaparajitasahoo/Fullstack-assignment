import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { CreateTaskInput, UpdateTaskInput, TaskQueryInput } from '../schemas/task.schema';

export async function listTasks(userId: string, query: TaskQueryInput) {
  const { page, limit, status, search, sortBy, order } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.TaskWhereInput = { userId };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.title = { contains: search };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createTask(userId: string, data: CreateTaskInput) {
  return prisma.task.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      status: data.status || 'TODO',
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      userId,
    },
  });
}

export async function getTaskById(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  return task;
}

export async function updateTask(userId: string, taskId: string, data: UpdateTaskInput) {
  // Verify ownership first
  await getTaskById(userId, taskId);

  const updateData: Prisma.TaskUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  return prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });
}

export async function deleteTask(userId: string, taskId: string) {
  // Verify ownership first
  await getTaskById(userId, taskId);

  await prisma.task.delete({ where: { id: taskId } });
}

const STATUS_CYCLE: Record<string, string> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'TODO',
};

export async function toggleTaskStatus(userId: string, taskId: string) {
  const task = await getTaskById(userId, taskId);
  const nextStatus = STATUS_CYCLE[task.status] || 'TODO';

  return prisma.task.update({
    where: { id: taskId },
    data: { status: nextStatus },
  });
}
