import * as React from 'react';
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryNode, ItemWithSubcategories, OrderStatus } from "@/types/inventory";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BasicDetailsTab } from "@/components/BasicDetailsTab";
import { InventorySupplyTab } from "@/components/InventorySupplyTab";
import { AdditionalInfoTab } from "@/components/AdditionalInfoTab";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Cabinet } from "@/types/cabinets";
import { ItemTemplate } from "@/types/templates";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";

const templateFormSchema = z.object({
  templateName: z.string().min(2, "Template name must be at least 2 characters"),
  name: z.string().min(2, "Item name must be at least 2 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  minQuantity: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional(),
  location: z.string().min(1, "Location is required"),
  locationSubcategory: z.string().optional(),
  supplier: z.string().optional(),
  supplierWebsite: z.string().url().optional(),
  notes: z.string().optional(),
  orderStatus: z.nativeEnum(OrderStatus).optional(),
  barcode: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface TemplateFormProps {
  template?: ItemTemplate;
  onSubmit: (data: ItemTemplate) => void;
  onCancel: () => void;
  categories: CategoryNode[];
  units: ItemWithSubcategories[];
  locations: ItemWithSubcategories[];
  suppliers: ItemWithSubcategories[];
  cabinets?: Cabinet[];
  projects?: ItemWithSubcategories[];
  isSubmitting?: boolean;
}

function flattenCategories(categories: CategoryNode[]): string[] {
  const flattened: string[] = [];

  function traverse(node: CategoryNode, currentPath: string = '') {
    const path = currentPath ? `${currentPath}/${node.name}` : node.name;
    flattened.push(path);

    if (node.children) {
      node.children.forEach(child => traverse(child, path));
    }
  }

  categories.forEach(category => traverse(category));
  return flattened.sort();
}

export function TemplateForm({ 
  template, 
  onSubmit, 
  onCancel,
  categories,
  units,
  locations,
  suppliers,
  cabinets = [],
  projects = [],
  isSubmitting = false
}: TemplateFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      templateName: template?.templateName || "",
      name: template?.name || "",
      description: template?.description || "",
      category: template?.category || "",
      unit: template?.unit || "",
      minQuantity: template?.minQuantity || 0,
      reorderLevel: template?.reorderLevel || 0,
      location: template?.location || "",
      locationSubcategory: template?.locationSubcategory || "",
      supplier: template?.supplier || "",
      supplierWebsite: template?.supplierWebsite || "",
      notes: template?.notes || "",
      orderStatus: template?.orderStatus || OrderStatus.PENDING,
      barcode: template?.barcode || "",
    },
  });

  const handleScanResult = (result: string) => {
    form.setValue("barcode", result);
    toast({
      title: "Barcode Scanned",
      description: `Successfully scanned barcode: ${result}`,
    });
    setIsScannerOpen(false);
  };

  const handleSubmit: SubmitHandler<TemplateFormData> = (data) => {
    const templateData: ItemTemplate = {
      templateId: template?.templateId || crypto.randomUUID(),
      templateName: data.templateName,
      name: data.name,
      description: data.description || "",
      category: data.category,
      unit: data.unit,
      minQuantity: data.minQuantity || 0,
      reorderLevel: data.reorderLevel || 0,
      location: data.location,
      locationSubcategory: data.locationSubcategory || "",
      supplier: data.supplier || "",
      supplierWebsite: data.supplierWebsite || "",
      notes: data.notes || "",
      orderStatus: data.orderStatus || OrderStatus.PENDING,
      quantity: 0,
      costPerUnit: 0,
      price: 0,
      barcode: data.barcode || "",
      project: "",
      deliveryPercentage: 0,
    };

    onSubmit(templateData);
    toast({
      title: template ? "Template Updated" : "Template Created",
      description: `Successfully ${template ? "updated" : "created"} template "${data.templateName}"`,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-4">
        <div className="mb-6 border-b pb-4">
          <FormField
            control={form.control}
            name="templateName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter template name" />
                </FormControl>
                <FormDescription>
                  Give your template a unique name to identify it later
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Item Details</TabsTrigger>
            <TabsTrigger value="inventory">Inventory & Supply</TabsTrigger>
            <TabsTrigger value="additional">Additional Info</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <BasicDetailsTab 
              form={form} 
              categories={categories} 
              locations={locations}
              cabinets={cabinets}
              projects={projects}
            />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 mt-4">
            <InventorySupplyTab 
              form={form} 
              units={units}
              suppliers={suppliers}
            />
          </TabsContent>

          <TabsContent value="additional" className="space-y-4 mt-4">
            <AdditionalInfoTab 
              form={form}
              onScanBarcode={() => setIsScannerOpen(true)}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6 sticky bottom-0 bg-background py-4 border-t">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>

      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleScanResult}
      />
    </Form>
  );
} 