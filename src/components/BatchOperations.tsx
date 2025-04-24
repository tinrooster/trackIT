import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItem, OrderStatus, Template } from '@/types/inventory';
import { toast } from 'sonner';
import { Trash2, Copy, Edit2, Save, CheckSquare, Square, Pencil } from 'lucide-react';
import { EditItemDialog } from '@/components/EditItemDialog';

interface BatchOperationsProps {
  onEdit: (item: InventoryItem) => void;
}

export function BatchOperations({ onEdit }: BatchOperationsProps) {
  const { items, updateItem, deleteItem, categories, units, locations, suppliers, projects } = useInventory();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [templates, setTemplates] = useState<Template[]>(() => {
    const savedTemplates = localStorage.getItem('inventoryTemplates');
    return savedTemplates ? JSON.parse(savedTemplates) : [];
  });
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [batchEditValues, setBatchEditValues] = useState<Partial<InventoryItem>>({});

  // Reset batch edit values when dialog opens/closes
  useEffect(() => {
    if (!isBatchEditOpen) {
      setBatchEditValues({});
    }
  }, [isBatchEditOpen]);

  // Save templates to localStorage
  const saveTemplates = (newTemplates: Template[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('inventoryTemplates', JSON.stringify(newTemplates));
  };

  // Handle item selection
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  // Batch delete selected items
  const handleBatchDelete = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to delete');
      return;
    }

    selectedItems.forEach(itemId => {
      deleteItem(itemId);
    });

    setSelectedItems(new Set());
    toast.success(`Deleted ${selectedItems.size} items`);
  };

  // Apply template to selected items
  const applyTemplate = (template: Template) => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to apply template to');
      return;
    }

    selectedItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        const updatedItem: InventoryItem = {
          ...item,
          ...template,
          id: item.id,
          lastUpdated: new Date(),
        };
        updateItem(updatedItem);
      }
    });

    toast.success(`Applied template to ${selectedItems.size} items`);
  };

  // Save current item as template
  const saveAsTemplate = () => {
    if (selectedItems.size !== 1) {
      toast.error('Please select exactly one item to save as template');
      return;
    }

    const item = items.find(i => i.id === Array.from(selectedItems)[0]);
    if (!item) return;

    const { id, lastUpdated, ...templateData } = item;
    const template: Template = {
      ...templateData,
      templateName: `${item.name} Template`,
    };

    saveTemplates([...templates, template]);
    toast.success('Template saved successfully');
  };

  // Batch edit selected items
  const handleBatchEdit = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to edit');
      return;
    }

    selectedItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        const updatedItem: InventoryItem = {
          ...item,
          ...Object.fromEntries(
            Object.entries(batchEditValues).filter(([_, value]) => value !== undefined && value !== '')
          ),
          lastUpdated: new Date(),
        };
        updateItem(updatedItem);
      }
    });

    setBatchEditValues({});
    setIsBatchEditOpen(false);
    toast.success(`Updated ${selectedItems.size} items`);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      // If all items are selected, clear selection
      setSelectedItems(new Set());
    } else {
      // Otherwise, select all items
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  // Template management functions
  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateName(template.templateName);
    setIsTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = (templateToDelete: Template) => {
    const newTemplates = templates.filter(t => t.templateName !== templateToDelete.templateName);
    saveTemplates(newTemplates);
    toast.success('Template deleted');
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;

    const updatedTemplates = templates.map(t => 
      t.templateName === selectedTemplate.templateName
        ? { ...selectedTemplate, templateName: templateName }
        : t
    );

    saveTemplates(updatedTemplates);
    setIsTemplateDialogOpen(false);
    setSelectedTemplate(null);
    setTemplateName('');
    toast.success('Template updated');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedItems(new Set())}
        >
          Clear Selection
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBatchDelete}
          disabled={selectedItems.size === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected ({selectedItems.size})
        </Button>
        <Dialog open={isBatchEditOpen} onOpenChange={setIsBatchEditOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedItems.size === 0}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Batch Edit ({selectedItems.size})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Batch Edit Items</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={batchEditValues.category || ''}
                  onValueChange={(value) => setBatchEditValues({ ...batchEditValues, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={batchEditValues.location || ''}
                  onValueChange={(value) => setBatchEditValues({ ...batchEditValues, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={batchEditValues.project || ''}
                  onValueChange={(value) => setBatchEditValues({ ...batchEditValues, project: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={batchEditValues.unit || ''}
                  onValueChange={(value) => setBatchEditValues({ ...batchEditValues, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={batchEditValues.supplier || ''}
                  onValueChange={(value) => setBatchEditValues({ ...batchEditValues, supplier: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Order Status</Label>
                <Select
                  value={batchEditValues.orderStatus || ''}
                  onValueChange={(value: OrderStatus) => setBatchEditValues({ ...batchEditValues, orderStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="partially_delivered">Partially Delivered</SelectItem>
                    <SelectItem value="backordered">Backordered</SelectItem>
                    <SelectItem value="on_order">On Order</SelectItem>
                    <SelectItem value="not_ordered">Not Ordered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleBatchEdit}>
                <Save className="mr-2 h-4 w-4" />
                Apply Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          size="sm"
          onClick={saveAsTemplate}
          disabled={selectedItems.size !== 1}
        >
          <Copy className="mr-2 h-4 w-4" />
          Save as Template
        </Button>
      </div>

      {/* Templates Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {templates.map((template, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-md hover:bg-accent"
            >
              <div className="flex-1">
                <h4 className="font-medium">{template.templateName}</h4>
                <p className="text-sm text-muted-foreground">
                  {template.category} - {template.location}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                  disabled={selectedItems.size === 0}
                  title="Apply template to selected items"
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditTemplate(template)}
                  title="Edit template"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template)}
                  title="Delete template"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Edit Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            <Button onClick={handleSaveTemplate}>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Selection Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.size === items.length && items.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Unit</th>
              <th className="p-2 text-left">Cost Per Unit</th>
              <th className="p-2 text-left">Total Value</th>
              <th className="p-2 text-left">Location</th>
              <th className="p-2 text-left">Project</th>
              <th className="p-2 text-left">Last Updated</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-muted/50">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="p-2">{item.name}</td>
                <td className="p-2">{item.category}</td>
                <td className="p-2">{item.quantity}</td>
                <td className="p-2">{item.unit}</td>
                <td className="p-2">${item.costPerUnit?.toFixed(2) || '0.00'}</td>
                <td className="p-2">
                  ${((item.costPerUnit || 0) * item.quantity).toFixed(2)}
                </td>
                <td className="p-2">{item.location}</td>
                <td className="p-2">{item.project}</td>
                <td className="p-2">
                  {item.lastUpdated.toLocaleString()}
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newSelection = new Set([item.id]);
                        setSelectedItems(newSelection);
                        handleBatchDelete();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 