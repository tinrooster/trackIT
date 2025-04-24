"use client";

import * as React from 'react';
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItem, OrderStatus, ItemWithSubcategories } from "@/types/inventory";
import { toast } from "sonner";
import { Loader2, Save, ScanLine, Keyboard, Camera } from "lucide-react";
import { OrderStatusSelector } from "@/components/OrderStatusSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";
import { ManualBarcodeInput } from "@/components/ManualBarcodeInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  deliveryPercentage: z.number().min(0).max(100).optional(),
  expectedDeliveryDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
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

interface EditItemFormProps {
  item: InventoryItem;
  onSubmit: (values: Omit<InventoryItem, "id" | "lastUpdated">) => void;
  onCancel: () => void;
  categories: string[];
  units: ItemWithSubcategories[];
  locations: ItemWithSubcategories[];
  suppliers: string[];
  projects: string[];
}

export function EditItemForm({
  item,
  onSubmit,
  onCancel,
  categories = [],
  units = [],
  locations = [],
  suppliers = [],
  projects = []
}: EditItemFormProps) {
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
    <Form {...form}>
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
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., BNC Connector" />
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
                        <Textarea {...field} placeholder="Brief description" className="resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="any" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                        <Input type="number" min="0" step="any" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                      <FormLabel>Unit*</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map(unit => (
                              <React.Fragment key={unit.id}>
                                <SelectItem value={unit.name}>
                                  {unit.name}
                                </SelectItem>
                                {unit.subcategories?.map(subcategory => (
                                  <SelectItem key={`${unit.name}/${subcategory}`} value={`${unit.name}/${subcategory}`}>
                                    {unit.name} - {subcategory}
                                  </SelectItem>
                                ))}
                              </React.Fragment>
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
                  name="costPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Per Unit ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="e.g., 1.25" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map(location => (
                              <React.Fragment key={location.id}>
                                <SelectItem value={location.name}>
                                  {location.name}
                                </SelectItem>
                                {location.subcategories?.map(subcategory => (
                                  <SelectItem key={`${location.name}/${subcategory}`} value={`${location.name}/${subcategory}`}>
                                    {location.name} - {subcategory}
                                  </SelectItem>
                                ))}
                              </React.Fragment>
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
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                  name="project"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
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
            </div>
          </TabsContent>

          <TabsContent value="order" className="space-y-4">
            <FormField
              control={form.control}
              name="orderStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Status</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Percentage</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
    </Form>
  );
}