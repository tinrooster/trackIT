import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, GripVertical, Plus, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
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
import { ItemWithSubcategories } from '@/types/inventory';

interface SortableItemProps {
  item: ItemWithSubcategories;
  onEdit: (id: string, newValue: string) => void;
  onDelete: (id: string) => void;
  onAddSubcategory: (id: string, subcategory: string) => void;
  onEditSubcategory: (id: string, oldValue: string, newValue: string) => void;
  onDeleteSubcategory: (id: string, subcategory: string) => void;
}

function SortableItem({ 
  item, 
  onEdit, 
  onDelete, 
  onAddSubcategory, 
  onEditSubcategory,
  onDeleteSubcategory 
}: SortableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.name);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<string | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editValue.trim() !== item.name) {
      onEdit(item.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(item.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleAddSubcategory = () => {
    if (newSubcategory.trim()) {
      onAddSubcategory(item.id, newSubcategory.trim());
      setNewSubcategory('');
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
        <div className="flex items-center flex-1">
          <button {...attributes} {...listeners} className="p-1 mr-2 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          {isEditing ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="h-8"
              autoFocus
            />
          ) : (
            <span>{item.name}</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="pl-8 space-y-2">
        <div className="flex space-x-2">
          <Input
            type="text"
            className="flex-1"
            placeholder="Add subcategory"
            value={newSubcategory}
            onChange={(e) => setNewSubcategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddSubcategory();
              }
            }}
          />
          <Button onClick={handleAddSubcategory}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {item.subcategories?.map((subcategory) => (
          <div key={subcategory} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
            {editingSubcategory === subcategory ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => {
                  if (editValue.trim() !== subcategory) {
                    onEditSubcategory(item.id, subcategory, editValue.trim());
                  }
                  setEditingSubcategory(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editValue.trim() !== subcategory) {
                      onEditSubcategory(item.id, subcategory, editValue.trim());
                    }
                    setEditingSubcategory(null);
                  } else if (e.key === 'Escape') {
                    setEditingSubcategory(null);
                  }
                }}
                className="h-8"
                autoFocus
              />
            ) : (
              <>
                <span>{subcategory}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingSubcategory(subcategory)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDeleteSubcategory(item.id, subcategory)} 
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface EditableItemWithSubcategoriesListProps {
  items: ItemWithSubcategories[];
  setItems: (items: ItemWithSubcategories[]) => void;
  title: string;
  description?: string;
}

export function EditableItemWithSubcategoriesList({
  items,
  setItems,
  title,
  description,
}: EditableItemWithSubcategoriesListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleAddItem = () => {
    const input = document.querySelector(`input[placeholder="Add new ${title.toLowerCase().slice(0, -1)}"]`) as HTMLInputElement;
    if (input && input.value.trim()) {
      const newItem: ItemWithSubcategories = {
        id: Date.now().toString(),
        name: input.value.trim(),
        subcategories: [],
      };
      setItems([...items, newItem]);
      input.value = '';
    }
  };

  const handleEditItem = (id: string, newValue: string) => {
    const newItems = items.map((item) => 
      item.id === id ? { ...item, name: newValue } : item
    );
    setItems(newItems);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleAddSubcategory = (id: string, subcategory: string) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          subcategories: [...(item.subcategories || []), subcategory],
        };
      }
      return item;
    });
    setItems(newItems);
  };

  const handleEditSubcategory = (id: string, oldValue: string, newValue: string) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          subcategories: item.subcategories?.map((sub) => 
            sub === oldValue ? newValue : sub
          ),
        };
      }
      return item;
    });
    setItems(newItems);
  };

  const handleDeleteSubcategory = (id: string, subcategory: string) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          subcategories: item.subcategories?.filter((sub) => sub !== subcategory),
        };
      }
      return item;
    });
    setItems(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>

      <div className="flex space-x-2">
        <Input
          type="text"
          className="flex-1"
          placeholder={`Add new ${title.toLowerCase().slice(0, -1)}`}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleAddItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onAddSubcategory={handleAddSubcategory}
                onEditSubcategory={handleEditSubcategory}
                onDeleteSubcategory={handleDeleteSubcategory}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
} 