"use client";

import * as React from 'react';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItem, OrderStatus, CategoryNode, ItemWithSubcategories } from "@/types/inventory";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";
import { BasicDetailsTab } from "@/components/BasicDetailsTab";
import { InventorySupplyTab } from "@/components/InventorySupplyTab";
import { AdditionalInfoTab } from "@/components/AdditionalInfoTab";
import { Cabinet } from "@/types/cabinets";
import { ensureUrlProtocol } from "@/utils/url";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  unit: z.string().min(1, "Unit is required"),
  unitSubcategory: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  locationSubcategory: z.string().optional(),
  cabinet: z.string().optional(),
  project: z.string().optional(),
  minQuantity: z.number().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
  barcode: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  modelNumber: z.string().optional(),
  dateInService: z.string().optional(),
  manufacturerNotes: z.string().optional(),
  maintenanceNotes: z.string().optional(),
  additionalNotes: z.string().optional(),
  supplier: z.string().optional(),
  supplierWebsite: z.string().url().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Location extends ItemWithSubcategories {
  id: string;
  name: string;
}

interface AddItemFormProps {
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  categories: CategoryNode[];
  units: ItemWithSubcategories[];
  locations: Location[];
  suppliers: ItemWithSubcategories[];
  projects: ItemWithSubcategories[];
  cabinets: Cabinet[];
  isSubmitting?: boolean;
  initialValues?: Partial<FormValues>;
  existingItems?: InventoryItem[];
  existingManufacturers?: string[];
  existingSuppliers?: string[];
  existingProjects?: string[];
}

export function AddItemForm({
  onSubmit,
  onCancel,
  categories,
  units,
  locations,
  suppliers,
  projects,
  cabinets,
  isSubmitting = false,
  initialValues,
  existingItems = [],
  existingManufacturers = [],
  existingSuppliers = [],
  existingProjects = []
}: AddItemFormProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      category: initialValues?.category || "",
      quantity: initialValues?.quantity || 0,
      unit: initialValues?.unit || "",
      unitSubcategory: initialValues?.unitSubcategory || "",
      location: initialValues?.location || "",
      locationSubcategory: initialValues?.locationSubcategory || "",
      cabinet: initialValues?.cabinet || "",
      project: initialValues?.project || "",
      minQuantity: initialValues?.minQuantity || 0,
      costPerUnit: initialValues?.costPerUnit || 0,
      barcode: initialValues?.barcode || "",
      serialNumber: initialValues?.serialNumber || "",
      manufacturer: initialValues?.manufacturer || "",
      modelNumber: initialValues?.modelNumber || "",
      dateInService: initialValues?.dateInService || "",
      manufacturerNotes: initialValues?.manufacturerNotes || "",
      maintenanceNotes: initialValues?.maintenanceNotes || "",
      additionalNotes: initialValues?.additionalNotes || "",
      supplier: initialValues?.supplier || "",
      supplierWebsite: initialValues?.supplierWebsite || "",
    },
  });

  const handleScanResult = (result: string) => {
    form.setValue("barcode", result);
    toast.success(`Barcode scanned: ${result}`);
    setIsScannerOpen(false);
  };

  const onSubmitForm = async (values: FormValues) => {
    try {
      // Process the URL if present
      const processedValues = {
        ...values,
        supplierWebsite: values.supplierWebsite ? ensureUrlProtocol(values.supplierWebsite) : "",
      };
      
      await onSubmit(processedValues);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit form");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Item Details</TabsTrigger>
            <TabsTrigger value="inventory">Inventory & Supply</TabsTrigger>
            <TabsTrigger value="additional">Additional Info</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <BasicDetailsTab 
              form={form} 
              categories={categories} 
              locations={locations}
              cabinets={cabinets}
              projects={projects}
            />
          </TabsContent>

          <TabsContent value="inventory">
            <InventorySupplyTab 
              form={form} 
              units={units}
              suppliers={suppliers}
            />
          </TabsContent>

          <TabsContent value="additional">
            <AdditionalInfoTab 
              form={form}
              onScanBarcode={() => setIsScannerOpen(true)}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Item
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