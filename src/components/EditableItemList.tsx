import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, GripVertical, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface SortableItemProps {
  id: string;
  value: string;
  onEdit: (id: string, newValue: string) => void;
  onDelete: (id: string) => void;
}

function SortableItem({ id, value, onEdit, onDelete }: SortableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editValue.trim()) {
      onEdit(id, editValue.trim());
      setIsEditing(false);
    } else {
      toast.error("Value cannot be empty");
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-2 p-2 border rounded-md bg-background hover:bg-accent/10 group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {isEditing ? (
        <div className="flex-1 flex items-center space-x-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1"
          />
          <Button size="icon" variant="ghost" onClick={handleSave} title="Save">
            <Save className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCancel} title="Cancel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span className="flex-1">{value}</span>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(id)}
              title="Delete"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

interface EditableItemListProps {
  items: string[];
  setItems: (items: string[]) => void;
  title: string;
  description?: string;
}

export function EditableItemList({
  items,
  setItems,
  title,
  description,
}: EditableItemListProps) {
  const [newItem, setNewItem] = useState('');

  // Create a unique ID for each item
  const itemsWithIds = items.map((item) => ({ id: item, value: item }));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item === active.id);
      const newIndex = items.findIndex(item => item === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);
      }
    }
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      if (items.includes(newItem.trim())) {
        toast.error(`"${newItem.trim()}" already exists`);
        return;
      }
      
      setItems([...items, newItem.trim()]);
      setNewItem('');
      toast.success(`Added "${newItem.trim()}"`);
    }
  };

  const handleEditItem = (id: string, newValue: string) => {
    if (id !== newValue && items.includes(newValue)) {
      toast.error(`"${newValue}" already exists`);
      return;
    }
    
    const newItems = items.map(item => (item === id ? newValue : item));
    setItems(newItems);
    toast.success(`Updated "${id}" to "${newValue}"`);
  };

  const handleDeleteItem = (id: string) => {
    const newItems = items.filter(item => item !== id);
    setItems(newItems);
    toast.success(`Deleted "${id}"`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="flex space-x-2">
        <Input
          placeholder={`Add new ${title.toLowerCase().slice(0, -1)}...`}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button onClick={handleAddItem} disabled={!newItem.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-md p-2">
        {items.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No items yet. Add your first one above.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {itemsWithIds.map(({ id, value }) => (
                <SortableItem
                  key={id}
                  id={id}
                  value={value}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}