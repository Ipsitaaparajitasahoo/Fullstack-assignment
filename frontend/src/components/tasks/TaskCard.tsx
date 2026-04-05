'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit2, Trash2, Calendar, ArrowRightCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useTaskStore } from '@/store/task-store';
import { statusLabels, priorityLabels, statusColors, priorityColors, formatDate } from '@/lib/utils';
import type { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const toggleStatus = useTaskStore((s) => s.toggleStatus);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggleStatus(task.id);
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1 mr-2">
          {task.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            aria-label="Edit task"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge className={statusColors[task.status]}>
          {statusLabels[task.status]}
        </Badge>
        <Badge className={priorityColors[task.priority]}>
          {priorityLabels[task.priority]}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </div>
        )}
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            isLoading={isToggling}
            className="text-xs"
          >
            <ArrowRightCircle className="h-3.5 w-3.5 mr-1" />
            Next Status
          </Button>
        </div>
      </div>
    </div>
  );
}
