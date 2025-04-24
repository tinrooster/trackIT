import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddItemForm } from "@/components/AddItemForm";
import { InventoryItem } from "@/types/inventory";
import { getSettings } from "@/lib/storageService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

type OrderStatus = 'delivered' | 'partially_delivered' | 'backordered' | 'on_order' | 'not_ordered';

interface Template extends Omit<InventoryItem, 'id' | 'lastUpdated' | 'createdBy' | 'lastModifiedBy'> {
  templateName: string;
}

interface AddItemDialogProps {
  onSubmit: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  units: string[];
  locations: string[];
  suppliers: string[];
  projects: string[];
}

export function AddItemDialog({ 
  open, 
  onOpenChange,
  onSubmit,
  categories,
  units,
  locations,
  suppliers,
  projects 
}: AddItemDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "template">("new");

  useEffect(() => {
    const loadedTemplates = getSettings("inventoryTemplates") || [];
    if (Array.isArray(loadedTemplates)) {
      setTemplates(loadedTemplates.map(template => {
        if (typeof template === 'object' && template !== null) {
          return template as Template;
        }
        return null;
      }).filter((t): t is Template => t !== null));
    }
  }, []);

  const handleTemplateSelect = (templateName: string) => {
    const template = templates.find(t => t.templateName === templateName);
    setSelectedTemplate(template || null);
    if (template) {
      setActiveTab("new"); // Switch to the form tab after selecting a template
      toast.success(`Template "${templateName}" loaded`);
    }
  };

  const handleSubmit = async (values: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert Template to form values
  const formValues = selectedTemplate ? {
    name: selectedTemplate.name,
    description: selectedTemplate.description,
    quantity: 0, // Reset quantity for new item
    minQuantity: selectedTemplate.minQuantity,
    unit: selectedTemplate.unit,
    costPerUnit: selectedTemplate.costPerUnit,
    category: selectedTemplate.category,
    location: selectedTemplate.location,
    supplier: selectedTemplate.supplier,
    supplierWebsite: selectedTemplate.supplierWebsite,
    project: selectedTemplate.project,
    notes: selectedTemplate.notes,
    orderStatus: selectedTemplate.orderStatus,
    deliveryPercentage: selectedTemplate.deliveryPercentage
  } : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "new" | "template")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">New Item</TabsTrigger>
            <TabsTrigger value="template">From Template</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <AddItemForm
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              categories={categories}
              units={units}
              locations={locations}
              suppliers={suppliers}
              projects={projects}
              isSubmitting={isSubmitting}
              initialValues={formValues}
            />
          </TabsContent>

          <TabsContent value="template">
            <div className="space-y-4">
              {templates.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <CardDescription>
                      No templates available. Create templates from existing items to reuse them later.
                    </CardDescription>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-4">
                  {templates.map((template) => (
                    <Card
                      key={template.templateName}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleTemplateSelect(template.templateName)}
                    >
                      <CardContent className="p-4">
                        <div className="font-medium">{template.templateName}</div>
                        <CardDescription className="mt-1">
                          {template.description || 'No description'}
                        </CardDescription>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {template.category && <span className="mr-2">Category: {template.category}</span>}
                          {template.unit && <span>Unit: {template.unit}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}