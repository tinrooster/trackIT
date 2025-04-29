import { FC, useState, KeyboardEvent, ChangeEvent } from 'react';
import { CategoryNode } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, ChevronDown, Plus, Trash, Edit, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CategoryTreeManagerProps {
  categories: CategoryNode[];
  onCategoriesChange: (categories: CategoryNode[]) => void;
}

interface CategoryItemProps {
  category: CategoryNode;
  level: number;
  onUpdate: (updatedCategory: CategoryNode) => void;
  onDelete: (categoryId: string) => void;
  onAddChild: (parentId: string, name: string) => void;
}

const CategoryItem: FC<CategoryItemProps> = ({
  category,
  level,
  onUpdate,
  onDelete,
  onAddChild,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    data: {
      type: 'category',
      category,
      parentId: category.parentId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggle = () => setIsExpanded(!isExpanded);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedName.trim()) {
      onUpdate({ ...category, name: editedName.trim() });
      setIsEditing(false);
    }
  };

  const handleAddSubcategory = () => {
    if (newSubcategoryName.trim()) {
      onAddChild(category.id, newSubcategoryName.trim());
      setNewSubcategoryName('');
      setIsAddingSubcategory(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedName(category.name);
      setIsEditing(false);
    }
  };

  const handleSubcategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddSubcategory();
    } else if (e.key === 'Escape') {
      setNewSubcategoryName('');
      setIsAddingSubcategory(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div className="flex items-center space-x-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-md p-2" style={{ marginLeft: `${level * 20}px` }}>
        <button {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        {category.children && category.children.length > 0 ? (
          <button onClick={handleToggle} className="p-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}
        
        {isEditing ? (
          <Input
            value={editedName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditedName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-8 w-48"
            autoFocus
          />
        ) : (
          <span className="flex-1">{category.name}</span>
        )}
        
        <div className="flex items-center space-x-1">
          {isAddingSubcategory ? (
            <div className="flex items-center gap-1">
              <Input
                value={newSubcategoryName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewSubcategoryName(e.target.value)}
                onKeyDown={handleSubcategoryKeyDown}
                placeholder="New subcategory name"
                className="h-8 w-48"
                autoFocus
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSubcategory}
                disabled={!newSubcategoryName.trim()}
              >
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingSubcategory(false);
                  setNewSubcategoryName('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingSubcategory(true)}
              title="Add subcategory"
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Sub
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            title="Edit category"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(category.id)}
            title="Delete category"
            className="text-destructive"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && category.children && (
        <SortableContext items={category.children.map(child => child.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {category.children.map((child: CategoryNode) => (
              <CategoryItem
                key={child.id}
                category={child}
                level={level + 1}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
};

export const CategoryTreeManager: FC<CategoryTreeManagerProps> = ({
  categories,
  onCategoriesChange,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findCategory = (categories: CategoryNode[], id: string): CategoryNode | null => {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.children) {
        const found = findCategory(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const removeCategory = (categories: CategoryNode[], id: string): CategoryNode[] => {
    return categories.filter(category => {
      if (category.id === id) return false;
      if (category.children) {
        category.children = removeCategory(category.children, id);
      }
      return true;
    });
  };

  const updateCategoryPath = (category: CategoryNode, parentPath?: string): CategoryNode => {
    const newPath = parentPath ? `${parentPath}/${category.name}` : category.name;
    return {
      ...category,
      path: newPath,
      children: category.children
        ? category.children.map(child => updateCategoryPath(child, newPath))
        : [],
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const category = findCategory(categories, active.id as string);
    if (category) setActiveCategory(category);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      setActiveCategory(null);
      return;
    }

    const activeCategory = findCategory(categories, active.id as string);
    const overCategory = findCategory(categories, over.id as string);

    if (!activeCategory || !overCategory) return;

    // Remove the dragged category from its current position
    let newCategories = removeCategory(categories, activeCategory.id);

    // Helper function to add category to a specific parent
    const addToParent = (cats: CategoryNode[], parentId: string | undefined): CategoryNode[] => {
      if (!parentId) {
        // Add to root level
        return [...cats, updateCategoryPath(activeCategory)];
      }

      return cats.map(cat => {
        if (cat.id === parentId) {
          return {
            ...cat,
            children: [...(cat.children || []), updateCategoryPath(activeCategory, cat.path)],
          };
        }
        if (cat.children) {
          return {
            ...cat,
            children: addToParent(cat.children, parentId),
          };
        }
        return cat;
      });
    };

    // Add the category to its new position
    newCategories = addToParent(newCategories, overCategory.parentId);

    onCategoriesChange(newCategories);
    setActiveId(null);
    setActiveCategory(null);
  };

  const updateCategory = (updatedCategory: CategoryNode) => {
    const updateInTree = (cats: CategoryNode[]): CategoryNode[] => {
      return cats.map((cat) => {
        if (cat.id === updatedCategory.id) {
          return updatedCategory;
        }
        if (cat.children) {
          return {
            ...cat,
            children: updateInTree(cat.children),
          };
        }
        return cat;
      });
    };

    const newCategories = updateInTree(categories);
    onCategoriesChange(newCategories);
  };

  const deleteCategory = (categoryId: string) => {
    const deleteFromTree = (cats: CategoryNode[]): CategoryNode[] => {
      return cats.filter((cat) => {
        if (cat.id === categoryId) {
          return false;
        }
        if (cat.children) {
          cat.children = deleteFromTree(cat.children);
        }
        return true;
      });
    };

    const newCategories = deleteFromTree(categories);
    onCategoriesChange(newCategories);
    toast.success('Category deleted');
  };

  const addCategory = (parentId?: string, categoryName?: string) => {
    const nameToUse = parentId ? categoryName : newCategoryName.trim();
    
    if (!nameToUse) {
      toast.error('Please enter a category name');
      return;
    }

    const newCategory: CategoryNode = {
      id: uuidv4(),
      name: nameToUse,
      children: [],
      parentId,
      path: nameToUse,
    };

    if (!parentId) {
      // Add as root category
      onCategoriesChange([...categories, newCategory]);
      setNewCategoryName('');
    } else {
      // Add as child category
      const addToTree = (cats: CategoryNode[]): CategoryNode[] => {
        return cats.map((cat) => {
          if (cat.id === parentId) {
            const updatedCategory = {
              ...cat,
              children: [...(cat.children || []), {
                ...newCategory,
                path: `${cat.path}/${newCategory.name}`,
              }],
            };
            return updatedCategory;
          }
          if (cat.children) {
            return {
              ...cat,
              children: addToTree(cat.children),
            };
          }
          return cat;
        });
      };

      const newCategories = addToTree(categories);
      onCategoriesChange(newCategories);
    }
    toast.success('Category added successfully');
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Enter category name"
            value={newCategoryName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewCategoryName(e.target.value)}
            className="w-64"
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                addCategory();
              }
            }}
          />
          <Button onClick={() => addCategory()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          Use the + button next to existing categories to add subcategories
        </div>

        <SortableContext items={categories.map(cat => cat.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mt-4">
            {categories.map((category: CategoryNode) => (
              <CategoryItem
                key={category.id}
                category={category}
                level={0}
                onUpdate={updateCategory}
                onDelete={deleteCategory}
                onAddChild={(parentId, name) => addCategory(parentId, name)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && activeCategory ? (
            <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-md p-2 opacity-80">
              {activeCategory.name}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}; 