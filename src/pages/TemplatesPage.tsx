import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Copy } from "lucide-react";
import { ItemTemplate } from '@/types/templates';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { TemplateForm } from '@/components/TemplateForm';
import { useNavigate } from 'react-router-dom';

// Mock data - replace with actual data fetching
const mockTemplates: ItemTemplate[] = [
  {
    templateId: "1",
    templateName: "Basic Electronic Component",
    name: "Component",
    description: "Standard electronic component template",
    quantity: 0,
    unit: "pcs",
    category: "Electronics",
    minQuantity: 10,
    costPerUnit: 0,
    price: 0,
    location: "",
    barcode: "",
    notes: "",
    supplier: "",
    supplierWebsite: "",
    project: "",
    reorderLevel: 5,
    orderStatus: "not_ordered",
    deliveryPercentage: 0
  }
];

export function TemplatesPage() {
  const [templates, setTemplates] = useState<ItemTemplate[]>(mockTemplates);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ItemTemplate | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditTemplate = (template: ItemTemplate) => {
    setSelectedTemplate(template);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.templateId !== templateId));
    toast({
      title: "Template Deleted",
      description: "The template has been successfully deleted.",
    });
  };

  const handleUseTemplate = (template: ItemTemplate) => {
    // Navigate to create item page with template data
    navigate('/inventory/new', { state: { template } });
  };

  const handleSubmitTemplate = (templateData: ItemTemplate) => {
    if (selectedTemplate) {
      // Update existing template
      setTemplates(templates.map(t => 
        t.templateId === templateData.templateId ? templateData : t
      ));
    } else {
      // Add new template
      setTemplates([...templates, templateData]);
    }
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Item Templates</h1>
          <p className="text-muted-foreground">
            Create and manage templates for frequently added items
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.templateId}>
            <CardHeader>
              <CardTitle>{template.templateName}</CardTitle>
              <CardDescription>{template.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {template.description}
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTemplate(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.templateId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              Fill in the template details below. Templates can be used to quickly create new inventory items.
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            template={selectedTemplate || undefined}
            onSubmit={handleSubmitTemplate}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 