import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

interface ListManagementProps {
  items: string[];
  onItemsChange: (items: string[]) => void;
  onAddItem: () => void;
  addButtonLabel?: string;
}

export function ListManagement({
  items,
  onItemsChange,
  onAddItem,
  addButtonLabel = 'Add Item',
}: ListManagementProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id.toString());
      const newIndex = items.indexOf(over.id.toString());
      onItemsChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleRemove = (id: string) => {
    onItemsChange(items.filter(item => item !== id));
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((id) => (
              <SortableItem 
                key={id} 
                id={id} 
                value={id}
                onRemove={() => handleRemove(id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onAddItem}
      >
        <Plus className="mr-2 h-4 w-4" />
        {addButtonLabel}
      </Button>
    </div>
  );
} 