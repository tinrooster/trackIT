import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddItemForm } from "@/components/AddItemForm";
import { InventoryItem, CategoryNode, ItemWithSubcategories } from "@/types/inventory";
import { getTemplates } from "@/lib/storageService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { ItemTemplate } from "@/types/templates";

type OrderStatus = 'delivered' | 'partially_delivered' | 'backordered' | 'on_order' | 'not_ordered';

interface Template extends Omit<InventoryItem, 'id' | 'lastUpdated' | 'createdBy' | 'lastModifiedBy'> {
  templateName: string;
  templateId: string;
}

interface AddItemDialogProps {
  onSubmit: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryNode[];
  units: ItemWithSubcategories[];
  locations: ItemWithSubcategories[];
  suppliers: ItemWithSubcategories[];
  projects: ItemWithSubcategories[];
  selectedTemplate?: ItemTemplate | null;
  existingItems: InventoryItem[];
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
  selectedTemplate: externalSelectedTemplate,
  existingItems
}: AddItemDialogProps) {
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ItemTemplate | null>(null);
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
                return template as ItemTemplate;
              }
              console.error('[DEBUG] Invalid template found:', template);
              return null;
            })
            .filter((t): t is ItemTemplate => t !== null);
          
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
      // Find matching supplier from the suppliers list
      const supplierMatch = suppliers.find(s => s.name === externalSelectedTemplate.supplier);
      const locationMatch = locations.find(l => l.id === externalSelectedTemplate.location);
      const unitMatch = units.find(u => u.name === externalSelectedTemplate.unit);
      const projectMatch = projects.find(p => p.name === externalSelectedTemplate.project);

      const templateValues = {
        name: externalSelectedTemplate.name,
        description: externalSelectedTemplate.description,
        quantity: 0,
        minQuantity: externalSelectedTemplate.minQuantity,
        unit: unitMatch ? unitMatch.name : '',
        costPerUnit: externalSelectedTemplate.costPerUnit,
        category: externalSelectedTemplate.category,
        location: locationMatch ? locationMatch.id : '',
        supplier: supplierMatch ? supplierMatch.name : '',
        supplierWebsite: externalSelectedTemplate.supplierWebsite,
        project: projectMatch ? projectMatch.name : '',
        notes: externalSelectedTemplate.notes,
        orderStatus: externalSelectedTemplate.orderStatus,
        deliveryPercentage: externalSelectedTemplate.deliveryPercentage
      };
      setFormValues(templateValues);
      setSelectedTemplate(externalSelectedTemplate);
      setActiveTab("new");
    }
  }, [externalSelectedTemplate, suppliers, locations, units, projects]);

  const handleTemplateSelect = (templateName: string) => {
    console.error('[DEBUG] Template selected:', templateName);
    const selectedTemplate = templates.find(t => t.templateName === templateName);
    if (selectedTemplate) {
      console.error('[DEBUG] Found template:', selectedTemplate);
      
      // Find matching values from the current settings
      const supplierMatch = suppliers.find(s => s.name === selectedTemplate.supplier);
      const locationMatch = locations.find(l => l.id === selectedTemplate.location);
      const unitMatch = units.find(u => u.name === selectedTemplate.unit);
      const projectMatch = projects.find(p => p.name === selectedTemplate.project);

      const newFormValues = {
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        quantity: 0,
        minQuantity: selectedTemplate.minQuantity,
        unit: unitMatch ? unitMatch.name : '',
        costPerUnit: selectedTemplate.costPerUnit,
        category: selectedTemplate.category,
        location: locationMatch ? locationMatch.id : '',
        supplier: supplierMatch ? supplierMatch.name : '',
        supplierWebsite: selectedTemplate.supplierWebsite,
        project: projectMatch ? projectMatch.name : '',
        notes: selectedTemplate.notes,
        orderStatus: selectedTemplate.orderStatus,
        deliveryPercentage: selectedTemplate.deliveryPercentage
      };
      
      console.error('[DEBUG] Setting form values:', newFormValues);
      setFormValues(newFormValues);
      setSelectedTemplate(selectedTemplate);
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
    console.log("[AddItemDialog] Received values for submit:", values);
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
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
        </DialogHeader>
        
        <div className="text-xs text-muted-foreground mb-2">
          Last Action: {lastAction}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 mb-4">
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
              existingItems={existingItems}
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
                <div className="space-y-4">
                  <Label>Select a Template</Label>
                  <Select 
                    onValueChange={handleTemplateSelect} 
                    defaultValue={templates[0]?.templateName || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem 
                          key={template.templateId} 
                          value={template.templateName}
                        >
                          {template.templateName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}