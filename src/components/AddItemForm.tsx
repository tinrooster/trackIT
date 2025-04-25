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
import { AutocompleteInput } from './AutocompleteInput';
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

// Add URL validation helper
const ensureUrlProtocol = (url: string) => {
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

interface Cabinet {
  id: string;
  name: string;
  locationId: string;
  description: string;
  isSecure: boolean;
  allowedCategories: string[];
  qrCode: string;
}

interface Location extends ItemWithSubcategories {
  id: string;
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.coerce.number().min(0, "Cost must be 0 or greater").optional(),
  location: z.string().min(1, "Location is required"),
  supplier: z.string().optional(),
  supplierWebsite: z.string()
    .transform((val) => val ? ensureUrlProtocol(val.trim()) : '')
    .optional(),
  project: z.string().optional(),
  minQuantity: z.coerce.number().min(0, "Minimum quantity must be 0 or greater").optional(),
  notes: z.string().optional(),
  orderStatus: z.nativeEnum(OrderStatus).default(OrderStatus.PENDING),
  deliveryPercentage: z.coerce.number().min(0).max(100).default(100),
  barcode: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  cabinet: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddItemFormProps {
  onSubmit: (values: Omit<InventoryItem, "id" | "lastUpdated">) => void;
  onCancel: () => void;
  categories: CategoryNode[];
  units: ItemWithSubcategories[];
  locations: Location[];
  suppliers: ItemWithSubcategories[];
  projects: ItemWithSubcategories[];
  isSubmitting?: boolean;
  initialValues?: Partial<Omit<InventoryItem, "id" | "lastUpdated">>;
  existingItems?: InventoryItem[];
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
  categories = [],
  units = [],
  locations = [],
  suppliers = [],
  projects = [],
  existingItems = [],
  isSubmitting = false,
  initialValues
}: AddItemFormProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualScanMode, setIsManualScanMode] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [deliveryPercentage, setDeliveryPercentage] = useState<number>(100);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | undefined>(undefined);
  const [cabinets, setCabinets] = React.useState<Cabinet[]>([])
  const [availableCabinets, setAvailableCabinets] = React.useState<Cabinet[]>([])

  // Extract unique notes and websites from existing items
  const existingNotes = React.useMemo(() => 
    Array.from(new Set(existingItems
      .map(item => item.notes)
      .filter(Boolean) as string[]
    )), [existingItems]
  );

  const existingWebsites = React.useMemo(() => 
    Array.from(new Set(existingItems
      .map(item => item.supplierWebsite)
      .filter(Boolean) as string[]
    )), [existingItems]
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      quantity: initialValues?.quantity || 1,
      unit: initialValues?.unit || "",
      costPerUnit: initialValues?.costPerUnit,
      category: initialValues?.category || "",
      location: initialValues?.location || "",
      minQuantity: initialValues?.minQuantity,
      barcode: initialValues?.barcode || "",
      notes: initialValues?.notes || "",
      supplier: initialValues?.supplier || "",
      supplierWebsite: initialValues?.supplierWebsite || "",
      project: initialValues?.project || "",
      orderStatus: initialValues?.orderStatus || OrderStatus.PENDING,
      deliveryPercentage: initialValues?.deliveryPercentage || 100,
      expectedDeliveryDate: initialValues?.expectedDeliveryDate ? initialValues.expectedDeliveryDate.toISOString().split('T')[0] : undefined,
      cabinet: initialValues?.cabinet || ""
    }
  });

  const handleSubmit = async (values: FormData) => {
    const locationObj = locations.find(loc => loc.id === values.location);
    const locationName = locationObj ? locationObj.name : values.location; // Fallback to ID if not found
    console.log("[AddItemForm] Location ID:", values.location, "Resolved Name:", locationName);

    const formattedValues = {
      ...values,
      location: locationName, // Use the name here
      expectedDeliveryDate: values.expectedDeliveryDate ? new Date(values.expectedDeliveryDate) : undefined
    };
    await onSubmit(formattedValues as Omit<InventoryItem, "id" | "lastUpdated">);
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
      orderStatus: OrderStatus.PENDING,
      deliveryPercentage: 0
    };
    saveTemplates([template]);
    toast.success("Template saved successfully");
  };

  // Extract suggestions from the data
  const itemNameSuggestions = existingItems.map(item => item.name);
  const descriptionSuggestions = existingItems.map(item => item.description).filter(Boolean) as string[];
  const barcodeSuggestions = existingItems.map(item => item.barcode).filter(Boolean) as string[];
  const supplierWebsiteSuggestions = existingItems.map(item => item.supplierWebsite).filter(Boolean) as string[];

  console.log('Existing Items:', existingItems);
  console.log('Name Suggestions:', itemNameSuggestions);

  // Load cabinets from localStorage
  React.useEffect(() => {
    const savedCabinets = localStorage.getItem('cabinets');
    if (savedCabinets) {
      setCabinets(JSON.parse(savedCabinets));
    }
  }, []);

  // Filter cabinets based on selected location
  React.useEffect(() => {
    const selectedLocation = form.watch('location');
    const locationObj = locations.find(loc => loc.id === selectedLocation);
    setAvailableCabinets(
      cabinets.filter(cabinet => cabinet.locationId === locationObj?.id)
    );
  }, [form.watch('location'), cabinets, locations]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="order">Order Info</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Full-width fields */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name*</FormLabel>
                  <FormControl>
                    <AutocompleteInput
                      {...field}
                      suggestions={itemNameSuggestions}
                      placeholder="Item name"
                    />
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
                    <AutocompleteInput
                      {...field}
                      suggestions={descriptionSuggestions}
                      placeholder="Brief description"
                      className="min-h-[60px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Half-width fields grid */}
            <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem key={category.name} value={category.name}>
                              {category.name}
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
                    <FormLabel>Unit*</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || "single"}>
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

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location*</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location">
                            {locations.find(loc => loc.id === field.value)?.name || "Select location"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
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

              {availableCabinets.length > 0 && (
                <FormField
                  control={form.control}
                  name="cabinet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cabinet</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cabinet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {availableCabinets.map(cabinet => (
                              <SelectItem key={cabinet.id} value={cabinet.id}>
                                {cabinet.name} {cabinet.isSecure && '🔒'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Items in secure cabinets require checkout.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                            <SelectItem key={project.id} value={project.name}>
                              {project.name}
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity*</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" defaultValue="1" {...field} />
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
            </div>

            {/* Full-width Notes field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <AutocompleteInput
                      {...field}
                      suggestions={existingNotes}
                      placeholder="Additional notes"
                      className="min-h-[60px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bottom half-width fields */}
            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional barcode" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="order" className="space-y-4">
            <FormField
              control={form.control}
              name="orderStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(OrderStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              status === OrderStatus.PENDING && "bg-slate-400",
                              status === OrderStatus.IN_PROGRESS && "bg-blue-500",
                              status === OrderStatus.COMPLETED && "bg-green-500",
                              status === OrderStatus.CANCELLED && "bg-red-500",
                              status === OrderStatus.BACK_ORDERED && "bg-orange-500"
                            )} />
                            {status.replace(/_/g, ' ')}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("orderStatus") === OrderStatus.IN_PROGRESS && (
              <>
                <FormField
                  control={form.control}
                  name="deliveryPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Progress</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="relative">
                            <Slider
                              min={0}
                              max={100}
                              step={25}
                              value={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                              progressColor={
                                field.value === 0 ? "bg-slate-400" :
                                field.value <= 25 ? "bg-orange-500" :
                                field.value <= 50 ? "bg-blue-500" :
                                field.value <= 75 ? "bg-yellow-500" :
                                "bg-green-500"
                              }
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Delivery Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
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
                Adding...
              </>
            ) : (
              'Add Item'
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