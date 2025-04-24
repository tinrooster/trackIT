import React, { useState } from 'react';
import { CategoryNode } from '@/types/inventory';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, ChevronDown, ChevronRight, GripVertical, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CategoryManagerProps {
  categories: CategoryNode[];
  setCategories: (categories: CategoryNode[]) => void;
}

interface CategoryItemProps {
  category: CategoryNode;
  onUpdate: (updatedCategory: CategoryNode) => void;
  onDelete: () => void;
  onAddChild: () => void;
  level: number;
}

function CategoryItem({ category, onUpdate, onDelete, onAddChild, level }: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(category.name);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editValue.trim() !== category.name) {
      onUpdate({ ...category, name: editValue.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(category.name);
      setIsEditing(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col">
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md" style={{ marginLeft: `${level * 20}px` }}>
        <button {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        
        {category.children && category.children.length > 0 && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
        
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
          <span className="flex-1">{category.name}</span>
        )}
        
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onAddChild}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isExpanded && category.children && (
        <div className="mt-2">
          <DndContext
            sensors={useSensors(
              useSensor(PointerSensor),
              useSensor(KeyboardSensor, {
                coordinateGetter: sortableKeyboardCoordinates,
              })
            )}
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (over && active.id !== over.id) {
                const oldIndex = category.children!.findIndex((item) => item.id === active.id);
                const newIndex = category.children!.findIndex((item) => item.id === over.id);
                const newChildren = arrayMove(category.children!, oldIndex, newIndex);
                onUpdate({ ...category, children: newChildren });
              }
            }}
          >
            <SortableContext items={category.children} strategy={verticalListSortingStrategy}>
              {category.children.map((child) => (
                <CategoryItem
                  key={child.id}
                  category={child}
                  onUpdate={(updatedChild) => {
                    const newChildren = category.children!.map((c) =>
                      c.id === child.id ? updatedChild : c
                    );
                    onUpdate({ ...category, children: newChildren });
                  }}
                  onDelete={() => {
                    const newChildren = category.children!.filter((c) => c.id !== child.id);
                    onUpdate({ ...category, children: newChildren });
                  }}
                  onAddChild={() => {
                    const newChild: CategoryNode = {
                      id: crypto.randomUUID(),
                      name: 'New Category',
                    };
                    const newChildren = [...category.children!, newChild];
                    onUpdate({ ...category, children: newChildren });
                  }}
                  level={level + 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

export default function CategoryManager({ categories, setCategories }: CategoryManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);
      setCategories(arrayMove(categories, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Categories</h3>
        <Button
          onClick={() => {
            const newCategory: CategoryNode = {
              id: crypto.randomUUID(),
              name: 'New Category',
            };
            setCategories([...categories, newCategory]);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories} strategy={verticalListSortingStrategy}>
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onUpdate={(updatedCategory) => {
                const newCategories = categories.map((c) =>
                  c.id === category.id ? updatedCategory : c
                );
                setCategories(newCategories);
              }}
              onDelete={() => {
                setCategories(categories.filter((c) => c.id !== category.id));
              }}
              onAddChild={() => {
                const newChild: CategoryNode = {
                  id: crypto.randomUUID(),
                  name: 'New Category',
                };
                const newChildren = [...(category.children || []), newChild];
                const updatedCategory = { ...category, children: newChildren };
                const newCategories = categories.map((c) =>
                  c.id === category.id ? updatedCategory : c
                );
                setCategories(newCategories);
              }}
              level={0}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
} 