import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddItemForm } from "@/components/AddItemForm";
import { InventoryItem, CategoryNode } from "@/types/inventory";
import { getTemplates } from "@/lib/storageService";
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
  categories: CategoryNode[];
  units: string[];
  locations: string[];
  suppliers: string[];
  projects: string[];
  selectedTemplate?: Template | null;
}

export function AddItemDialog({ 
  open, 
  onOpenChange,
  onSubmit,
  categories,
  units,
  locations,
  suppliers,
  projects,
  selectedTemplate: externalSelectedTemplate 
}: AddItemDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "template">("new");
  const [formValues, setFormValues] = useState<Omit<InventoryItem, 'id' | 'lastUpdated'> | undefined>(undefined);
  const [lastAction, setLastAction] = useState<string>("");

  useEffect(() => {
    if (open) {
      console.error('[DEBUG] Dialog opened');
      try {
        const loadedTemplates = getTemplates();
        console.error('[DEBUG] Templates loaded:', loadedTemplates);
        
        if (Array.isArray(loadedTemplates)) {
          const validTemplates = loadedTemplates
            .map(template => {
              if (typeof template === 'object' && template !== null && template.templateName) {
                return template as Template;
              }
              console.error('[DEBUG] Invalid template found:', template);
              return null;
            })
            .filter((t): t is Template => t !== null);
          
          console.error('[DEBUG] Valid templates:', validTemplates);
          setTemplates(validTemplates);
        } else {
          console.error('[DEBUG] Loaded templates is not an array:', loadedTemplates);
          setTemplates([]);
        }
      } catch (error) {
        console.error('[DEBUG] Error loading templates:', error);
        toast.error('Failed to load templates');
        setTemplates([]);
      }
    }
  }, [open]);

  useEffect(() => {
    if (externalSelectedTemplate) {
      const templateValues = {
        name: externalSelectedTemplate.name,
        description: externalSelectedTemplate.description,
        quantity: 0,
        minQuantity: externalSelectedTemplate.minQuantity,
        unit: externalSelectedTemplate.unit,
        costPerUnit: externalSelectedTemplate.costPerUnit,
        category: externalSelectedTemplate.category,
        location: externalSelectedTemplate.location,
        supplier: externalSelectedTemplate.supplier,
        supplierWebsite: externalSelectedTemplate.supplierWebsite,
        project: externalSelectedTemplate.project,
        notes: externalSelectedTemplate.notes,
        orderStatus: externalSelectedTemplate.orderStatus,
        deliveryPercentage: externalSelectedTemplate.deliveryPercentage
      };
      setFormValues(templateValues);
      setSelectedTemplate(externalSelectedTemplate);
      setActiveTab("new");
    }
  }, [externalSelectedTemplate]);

  const handleTemplateSelect = (templateName: string) => {
    console.error('[DEBUG] Template selected:', templateName);
    const selectedTemplate = templates.find(t => t.templateName === templateName);
    if (selectedTemplate) {
      console.error('[DEBUG] Found template:', selectedTemplate);
      setSelectedTemplate(selectedTemplate);
      const newFormValues = {
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        quantity: 0,
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
      };
      console.error('[DEBUG] Setting form values:', newFormValues);
      setFormValues(newFormValues);
      setActiveTab("new");
      toast.success(`Template "${templateName}" loaded`);
    }
  };

  const handleTabChange = (value: string) => {
    console.error('[DEBUG] Tab changed to:', value);
    setActiveTab(value as "new" | "template");
    if (value === "new" && !selectedTemplate) {
      console.error('[DEBUG] Resetting form values');
      setFormValues(undefined);
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

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setLastAction(`Dialog ${newOpen ? 'opened' : 'closed'}`);
      if (!selectedTemplate || !newOpen) {
        onOpenChange(newOpen);
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        
        <div className="text-xs text-muted-foreground mb-2">
          Last Action: {lastAction}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTemplateSelect(template.templateName);
                      }}
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