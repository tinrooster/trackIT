import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteListItemDialog } from "./DeleteListItemDialog";
import { InventoryItem } from "@/types/inventory";

interface ListItem {
  id: string;
  name: string;
  subcategories?: ListItem[];
}

interface ListManagementProps {
  categories: ListItem[];
  units: ListItem[];
  locations: ListItem[];
  suppliers: ListItem[];
  projects: ListItem[];
  inventoryItems: InventoryItem[];
  onUpdate: (type: string, items: ListItem[]) => void;
}

export function ListManagement({
  categories,
  units,
  locations,
  suppliers,
  projects,
  inventoryItems,
  onUpdate,
}: ListManagementProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("lists");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: ListItem | null;
    type: string;
    items: ListItem[];
  }>({
    open: false,
    item: null,
    type: "",
    items: []
  });

  const toggleExpand = (id: string) => {
    setExpandedCategories(prev =>
      prev.includes(id)
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
    );
  };

  const handleAddSubcategory = (parentId: string) => {
    const newId = crypto.randomUUID();
    const updatedCategories = categories.map(cat => {
      if (cat.id === parentId) {
        return {
          ...cat,
          subcategories: [
            ...(cat.subcategories || []),
            { id: newId, name: "New Subcategory" }
          ]
        };
      }
      return cat;
    });
    onUpdate("categories", updatedCategories);
    toast.success("Subcategory added");
  };

  const handleDeleteConfirm = (reassignToId: string | null) => {
    if (!deleteDialog.item || !deleteDialog.type) return;

    const updatedItems = deleteDialog.items.filter(i => i.id !== deleteDialog.item?.id);
    onUpdate(deleteDialog.type, updatedItems);

    if (reassignToId) {
      // Handle reassignment logic here if needed
      const reassignTo = deleteDialog.items.find(i => i.id === reassignToId);
      if (reassignTo) {
        toast.success(`Items reassigned to "${reassignTo.name}"`);
      }
    }

    toast.success(`${deleteDialog.type.slice(0, -1)} deleted`);
  };

  const renderCategoryItem = (item: ListItem, level = 0) => (
    <div key={item.id} className="space-y-2">
      <div className="flex items-center gap-2">
        {item.subcategories && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleExpand(item.id)}
            className="w-6 h-6 p-0"
          >
            {expandedCategories.includes(item.id) ? "-" : "+"}
          </Button>
        )}
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={item.name}
            onChange={(e) => {
              const updatedCategories = categories.map(cat =>
                cat.id === item.id ? { ...cat, name: e.target.value } : cat
              );
              onUpdate("categories", updatedCategories);
            }}
            className="h-8"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddSubcategory(item.id)}
            className="w-8 h-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-destructive"
            onClick={() => setDeleteDialog({
              open: true,
              item,
              type: "categories",
              items: categories
            })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {item.subcategories && expandedCategories.includes(item.id) && (
        <div className="ml-6 space-y-2">
          {item.subcategories.map(subcat => renderCategoryItem(subcat, level + 1))}
        </div>
      )}
    </div>
  );

  const renderList = (items: ListItem[], type: string, singularName: string) => (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              value={item.name}
              onChange={(e) => {
                const updatedItems = items.map(i =>
                  i.id === item.id ? { ...i, name: e.target.value } : i
                );
                onUpdate(type, updatedItems);
              }}
              className="h-8"
            />
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-destructive"
              onClick={() => setDeleteDialog({
                open: true,
                item,
                type,
                items
              })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const newItem = {
            id: crypto.randomUUID(),
            name: `New ${singularName}`,
          };
          onUpdate(type, [...items, newItem]);
          toast.success(`${singularName} added`);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add {singularName}
      </Button>
    </div>
  );

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="lists">Lists</TabsTrigger>
          <TabsTrigger value="test">Test Tab</TabsTrigger>
        </TabsList>

        <TabsContent value="lists">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Manage categories and subcategories for organizing your inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map(cat => renderCategoryItem(cat))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCategory = {
                      id: crypto.randomUUID(),
                      name: "New Category",
                      subcategories: [],
                    };
                    onUpdate("categories", [...categories, newCategory]);
                    toast.success("Category added");
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Units</CardTitle>
                  <CardDescription>
                    Manage units for measuring your inventory items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderList(units, "units", "Unit")}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Locations</CardTitle>
                  <CardDescription>
                    Manage storage locations for your inventory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderList(locations, "locations", "Location")}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Suppliers</CardTitle>
                  <CardDescription>
                    Manage suppliers for your inventory items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderList(suppliers, "suppliers", "Supplier")}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>
                    Manage projects for your inventory items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderList(projects, "projects", "Project")}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Content</CardTitle>
              <CardDescription>This is a test tab</CardDescription>
            </CardHeader>
            <CardContent>
              Test content goes here
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {deleteDialog.item && (
        <DeleteListItemDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
          itemToDelete={deleteDialog.item}
          listType={deleteDialog.type}
          allItems={deleteDialog.items}
          inventoryItems={inventoryItems}
          onConfirmDelete={handleDeleteConfirm}
        />
      )}
    </div>
  );
} 