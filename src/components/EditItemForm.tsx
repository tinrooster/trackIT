"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormItem, FormMessage } from "@/components/ui/form"; // Using custom Form components
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItem, OrderStatus } from "@/types/inventory";
import { toast } from "sonner";
import { Loader2, Save, ScanLine, Keyboard, Camera } from "lucide-react"; // Added Keyboard and Camera icons
import { OrderStatusSelector } from "@/components/OrderStatusSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";
import { ManualBarcodeInput } from "@/components/ManualBarcodeInput"; // Import the new component
import { Label } from "@/components/ui/label"; // Import Label directly

// Helper function to prepend https:// if needed
const ensureUrlProtocol = (url: string | undefined): string | undefined => {
  if (!url || url.trim() === '') return undefined;
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, { message: "Quantity cannot be negative." }).default(0),
  minQuantity: z.coerce.number().min(0).optional(),
  unit: z.string().min(1, { message: "Unit is required." }),
  costPerUnit: z.coerce.number().min(0, { message: "Cost must be non-negative" }).optional(),
  price: z.coerce.number().min(0, { message: "Price must be non-negative" }).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  reorderLevel: z.coerce.number().min(0).optional(),
  barcode: z.string().optional(),
  notes: z.string().optional(),
  supplier: z.string().optional(),
  supplierWebsite: z.string().optional(),
  project: z.string().optional(),
  orderStatus: z.enum(['delivered', 'partially_delivered', 'backordered', 'on_order', 'not_ordered']).default('delivered'),
  deliveryPercentage: z.coerce.number().min(0).max(100).default(100),
}).refine(data => {
  if (data.supplierWebsite && data.supplierWebsite.trim() !== '') {
    try {
      const urlWithProtocol = ensureUrlProtocol(data.supplierWebsite);
      if (urlWithProtocol) { new URL(urlWithProtocol); }
      return true;
    } catch (_) { return false; }
  }
  return true;
}, { message: "Invalid URL format", path: ["supplierWebsite"] });

export function EditItemForm({
  item,
  onSubmit,
  onCancel,
  categories = [],
  units = [],
  locations = [],
  suppliers = [],
  projects = []
}: {
  item: InventoryItem;
  onSubmit: (values: Omit<InventoryItem, "id" | "lastUpdated">) => void;
  onCancel: () => void;
  categories: string[];
  units: string[];
  locations: string[];
  suppliers: string[];
  projects: string[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualScanMode, setIsManualScanMode] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name,
      description: item.description || "",
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      price: item.price,
      category: item.category || "",
      location: item.location || "",
      reorderLevel: item.reorderLevel,
      barcode: item.barcode || "",
      notes: item.notes || "",
      supplier: item.supplier || "",
      supplierWebsite: item.supplierWebsite || "",
      project: item.project || "",
      orderStatus: item.orderStatus,
      deliveryPercentage: item.deliveryPercentage,
    },
  });

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const processedValues = {
        ...values,
        quantity: Number(values.quantity) || 0,
        minQuantity: values.minQuantity === undefined ? undefined : Number(values.minQuantity),
        costPerUnit: values.costPerUnit === undefined ? undefined : Number(values.costPerUnit),
        price: values.price === undefined ? undefined : Number(values.price),
        reorderLevel: values.reorderLevel === undefined ? undefined : Number(values.reorderLevel),
        barcode: values.barcode?.trim() || undefined,
        category: values.category?.trim() || undefined,
        location: values.location?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        supplier: values.supplier?.trim() || undefined,
        supplierWebsite: ensureUrlProtocol(values.supplierWebsite?.trim()),
        project: values.project?.trim() || undefined,
        unit: values.unit.trim(),
        orderStatus: values.orderStatus,
        deliveryPercentage: Number(values.deliveryPercentage) || 100,
        expectedDeliveryDate: item.expectedDeliveryDate,
      };
      
      await onSubmit(processedValues);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanResult = (result: string) => {
    form.setValue("barcode", result); // Update form field with scanned value
    toast.success(`Barcode scanned: ${result}`);
  };

  const toggleManualScanMode = () => {
    setIsManualScanMode(!isManualScanMode);
     if (!isManualScanMode) {
      toast.info("Bluetooth scanner mode activated for Barcode field.");
    } else {
      toast.info("Switched to manual input for Barcode field.");
    }
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="details">Item Details</TabsTrigger>
            <TabsTrigger value="order">Order Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Item Name*</Label>
                  <Input id="name" placeholder="e.g., BNC Connector" {...form.register("name")} />
                  {form.formState.errors.name && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description" className="resize-none" {...form.register("description")} />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity*</Label>
                  <Input id="quantity" type="number" min="0" step="any" {...form.register("quantity")} />
                  {form.formState.errors.quantity && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.quantity.message}</p>}
                </div>
                <div>
                  <Label htmlFor="minQuantity">Minimum Quantity</Label>
                  <Input id="minQuantity" type="number" min="0" step="any" {...form.register("minQuantity")} />
                </div>
                <div>
                  <Label htmlFor="unit">Unit*</Label>
                  <select id="unit" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...form.register("unit")}>
                    <option value="">Select unit...</option>
                    {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                    {!units.includes(form.getValues().unit) && form.getValues().unit && <option value={form.getValues().unit}>{form.getValues().unit}</option>}
                  </select>
                  {form.formState.errors.unit && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.unit.message}</p>}
                </div>
                <div>
                  <Label htmlFor="costPerUnit">Cost Per Unit ($)</Label>
                  <Input id="costPerUnit" type="number" min="0" step="0.01" placeholder="e.g., 1.25" {...form.register("costPerUnit")} />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" type="number" min="0" step="0.01" placeholder="e.g., 1.99" {...form.register("price")} />
                </div>
              </div>
              {/* Column 2 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select id="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...form.register("category")}>
                    <option value="">Select category...</option>
                    {categories.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <select id="location" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...form.register("location")}>
                    <option value="">Select location...</option>
                    {locations.map(location => <option key={location} value={location}>{location}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <select id="supplier" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...form.register("supplier")}>
                    <option value="">Select supplier...</option>
                    {suppliers.map(supplier => <option key={supplier} value={supplier}>{supplier}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="project">Project</Label>
                  <select id="project" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...form.register("project")}>
                    <option value="">Select project...</option>
                    {projects.map(project => <option key={project} value={project}>{project}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="supplierWebsite">Supplier Website</Label>
                  <Input id="supplierWebsite" type="url" placeholder="e.g., www.supplier.com" {...form.register("supplierWebsite")} />
                </div>
                <div>
                  <Label htmlFor="reorderLevel">Reorder Level</Label>
                  <Input id="reorderLevel" type="number" min="0" placeholder="Min quantity" {...form.register("reorderLevel")} />
                </div>
                <div>
                  <Label htmlFor="barcode">Barcode</Label>
                  <div className="flex gap-2">
                    <Input id="barcode" {...form.register("barcode")} />
                    <Button type="button" variant="outline" size="icon" onClick={toggleManualScanMode}>
                      {isManualScanMode ? <Keyboard className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes..." className="resize-none" {...form.register("notes")} />
            </div>
          </TabsContent>

          <TabsContent value="order" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Order Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...form.register("orderStatus")}
                >
                  <option value="delivered">Delivered</option>
                  <option value="partially_delivered">Partially Delivered</option>
                  <option value="backordered">Backordered</option>
                  <option value="on_order">On Order</option>
                  <option value="not_ordered">Not Ordered</option>
                </select>
              </div>
              <div>
                <Label>Delivery Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  {...form.register("deliveryPercentage")}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleScanResult}
      />
    </>
  );
}