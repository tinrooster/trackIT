"use client";

import * as React from 'react';
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItem, OrderStatus, CategoryNode, ItemWithSubcategories } from "@/types/inventory";
import { ItemTemplate } from "@/types/templates";
import { toast } from "sonner";
import { Loader2, Save, ScanLine, Keyboard, Camera } from "lucide-react";
import { OrderStatusSelector } from "@/components/OrderStatusSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";
import { ManualBarcodeInput } from "@/components/ManualBarcodeInput";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveTemplates } from "@/lib/storageService";
import { Switch } from "@/components/ui/switch";

// Add URL validation helper
const ensureUrlProtocol = (url: string) => {
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.number().min(0, "Cost must be 0 or greater").optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  supplierWebsite: z.string().optional()
    .transform(val => val ? ensureUrlProtocol(val) : val)
    .refine(
      val => !val || /^https?:\/\//i.test(val),
      "Invalid URL format"
    ),
  project: z.string().optional(),
  minQuantity: z.number().min(0, "Minimum quantity must be 0 or greater").optional(),
  notes: z.string().optional(),
  orderStatus: z.enum(['delivered', 'partially_delivered', 'backordered', 'on_order', 'not_ordered'] as const).default('delivered'),
  deliveryPercentage: z.number().min(0).max(100).default(100)
});

interface AddItemFormProps {
  onSubmit: (values: Omit<InventoryItem, "id" | "lastUpdated">) => void;
  onCancel: () => void;
  categories: CategoryNode[];
  units: ItemWithSubcategories[];
  locations: ItemWithSubcategories[];
  suppliers: string[];
  projects: string[];
  isSubmitting: boolean;
  initialValues?: Partial<Omit<InventoryItem, "id" | "lastUpdated">>;
  selectedTemplate?: ItemTemplate;
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

export function AddItemForm({
  onSubmit,
  onCancel,
  categories,
  units,
  locations,
  suppliers,
  projects,
  isSubmitting,
  initialValues,
  selectedTemplate
}: AddItemFormProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualScanMode, setIsManualScanMode] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      category: initialValues?.category || "",
      quantity: initialValues?.quantity || 0,
      minQuantity: initialValues?.minQuantity || 0,
      costPerUnit: initialValues?.costPerUnit || 0,
      unit: initialValues?.unit || "",
      location: initialValues?.location || "",
      supplier: initialValues?.supplier || "",
      supplierWebsite: initialValues?.supplierWebsite || "",
      project: initialValues?.project || "",
      notes: initialValues?.notes || "",
      orderStatus: initialValues?.orderStatus || 'delivered',
      deliveryPercentage: initialValues?.deliveryPercentage || 100
    }
  });

  // Reset form when initialValues change
  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onSubmit(values);
      form.reset(); // Reset form after successful submission
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit form");
      throw error; // Re-throw to be caught by the dialog's error handler
    }
  };

  const handleScanResult = (result: string) => {
    toast.success(`Scanned: ${result}`);
  };

  const toggleManualScanMode = () => {
    setIsManualScanMode(!isManualScanMode);
    if (!isManualScanMode) {
      toast.info("Bluetooth scanner mode activated for Barcode field.");
    } else {
      toast.info("Switched to manual input for Barcode field.");
    }
  };

  const handleSaveTemplate = (data: z.infer<typeof formSchema>) => {
    const template: ItemTemplate = {
      templateId: crypto.randomUUID(),
      templateName: `${data.name} Template`,
      name: data.name,
      description: data.description ?? "",
      category: data.category ?? "",
      unit: data.unit ?? "",
      location: data.location ?? "",
      project: data.project ?? "",
      supplier: data.supplier ?? "",
      minQuantity: Number(data.minQuantity) || 0,
      quantity: Number(data.quantity) || 0,
      orderStatus: "not_ordered",
      deliveryPercentage: 0
    };
    saveTemplates([template]);
    toast.success("Template saved successfully");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Item name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Item description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {flattenCategories(categories).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.name}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="costPerUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost Per Unit</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.name}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="project"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier} value={supplier}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplierWebsite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier Website</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="www.example.com"
                    type="text"
                  />
                </FormControl>
                <FormDescription>
                  Enter website without http:// - it will be added automatically
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Additional notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Item
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}