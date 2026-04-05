'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { taskSchema, type TaskFormData } from '@/validations/task';
import { useTaskStore } from '@/store/task-store';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Task } from '@/types/task';
import { AxiosError } from 'axios';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
}

const statusOptions = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

const defaultValues: TaskFormData = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: '',
};

export function TaskForm({ isOpen, onClose, task }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { createTask, updateTask } = useTaskStore();
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [task, isOpen, reset]);

  const handleClose = useCallback(() => {
    reset(defaultValues);
    onClose();
  }, [reset, onClose]);

  const onSubmit = async (data: TaskFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        description: data.description || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      };

      if (isEditing) {
        await updateTask(task.id, payload);
        toast.success('Task updated successfully');
      } else {
        await createTask(payload);
        toast.success('Task created successfully');
      }
      handleClose();
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || 'Operation failed'
          : 'Operation failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="title"
          label="Title"
          placeholder="What needs to be done?"
          error={errors.title?.message}
          {...register('title')}
        />
        <div className="space-y-1">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Add more details..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            id="status"
            label="Status"
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
          <Select
            id="priority"
            label="Priority"
            options={priorityOptions}
            error={errors.priority?.message}
            {...register('priority')}
          />
        </div>
        <Input
          id="dueDate"
          label="Due Date"
          type="date"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
