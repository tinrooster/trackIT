import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface SortableItemProps {
  id: string;
  value: string;
  onRemove: () => void;
}

export function SortableItem({ id, value, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-background p-2',
        isDragging && 'opacity-50 cursor-grabbing'
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="cursor-grab hover:bg-accent hover:text-accent-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </Button>
      <span className="flex-1 truncate">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="hover:bg-destructive hover:text-destructive-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
} 