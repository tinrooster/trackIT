import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { getTemplates, saveTemplates } from '@/lib/storageService';
import { v4 as uuidv4 } from 'uuid';
import { AddItemDialog } from '@/components/AddItemDialog';
import { getSettings } from '@/lib/storageService';

export function TemplatesPage() {
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ItemTemplate | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load settings for AddItemDialog
  const categories = getSettings('CATEGORIES');
  const units = getSettings('UNITS');
  const locations = getSettings('LOCATIONS');
  const suppliers = getSettings('SUPPLIERS');
  const projects = getSettings('PROJECTS');

  // Load templates on component mount
  useEffect(() => {
    try {
      const loadedTemplates = getTemplates();
      console.log('Loaded templates:', loadedTemplates);
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    }
  }, []);

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditTemplate = (template: ItemTemplate) => {
    setSelectedTemplate(template);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    try {
      const newTemplates = templates.filter(t => t.templateId !== templateId);
      saveTemplates(newTemplates);
      setTemplates(newTemplates);
      toast({
        title: "Template Deleted",
        description: "The template has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleUseTemplate = (template: ItemTemplate) => {
    setSelectedTemplate(template);
    setIsAddItemDialogOpen(true);
  };

  const handleAddItem = async (newItemData: any) => {
    try {
      // Navigate to inventory page after successful addition
      navigate('/inventory', { state: { newItem: newItemData } });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleSubmitTemplate = (templateData: ItemTemplate) => {
    try {
      let newTemplates: ItemTemplate[];
      
      if (selectedTemplate) {
        // Update existing template
        newTemplates = templates.map(t => 
          t.templateId === templateData.templateId ? templateData : t
        );
      } else {
        // Add new template with generated ID
        const newTemplate = {
          ...templateData,
          templateId: uuidv4(),
        };
        newTemplates = [...templates, newTemplate];
      }

      // Save to storage and update state
      saveTemplates(newTemplates);
      setTemplates(newTemplates);
      setIsCreateDialogOpen(false);

      toast({
        title: selectedTemplate ? "Template Updated" : "Template Created",
        description: `Template has been ${selectedTemplate ? 'updated' : 'created'} successfully.`,
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
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

      <AddItemDialog
        open={isAddItemDialogOpen}
        onOpenChange={setIsAddItemDialogOpen}
        onSubmit={handleAddItem}
        categories={categories}
        units={units}
        locations={locations}
        suppliers={suppliers}
        projects={projects}
        selectedTemplate={selectedTemplate}
      />
    </div>
  );
} 