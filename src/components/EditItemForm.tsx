"use client";

import * as React from 'react';
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem, OrderStatus, CategoryNode, ItemWithSubcategories } from "@/types/inventory";
import { AutocompleteInput } from "./AutocompleteInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

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
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  location: z.string().min(1, "Location is required"),
  cabinet: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  supplier: z.string().optional(),
  supplierWebsite: z.string()
    .transform((val) => val ? ensureUrlProtocol(val.trim()) : '')
    .optional(),
  project: z.string().optional(),
  notes: z.string().optional(),
  orderStatus: z.nativeEnum(OrderStatus).default(OrderStatus.COMPLETED),
  deliveryPercentage: z.number().min(0).max(100).default(100),
  expectedDeliveryDate: z.string().optional(),
  minQuantity: z.number().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
  barcode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditItemFormProps {
  item: InventoryItem;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  categories: CategoryNode[];
  units: ItemWithSubcategories[];
  locations: { id: string; name: string; }[];
  suppliers: ItemWithSubcategories[];
  projects: ItemWithSubcategories[];
  cabinets: { id: string; name: string; locationId: string; isSecure?: boolean; }[];
  isSubmitting?: boolean;
}

export function EditItemForm({ 
  item, 
  onSubmit, 
  onCancel,
  categories = [],
  units = [],
  locations = [],
  suppliers = [],
  projects = [],
  cabinets = [],
  isSubmitting = false
}: EditItemFormProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [availableCabinets, setAvailableCabinets] = React.useState<typeof cabinets>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name,
      description: item.description || "",
      category: item.category,
      subcategory: item.subcategory || "",
      unit: item.unit,
      location: locations.find(loc => loc.id === item.location)?.name || item.location,
      cabinet: item.cabinet || "",
      quantity: item.quantity,
      supplier: item.supplier || "",
      supplierWebsite: item.supplierWebsite || "",
      project: item.project || "",
      notes: item.notes || "",
      orderStatus: item.orderStatus || OrderStatus.COMPLETED,
      deliveryPercentage: item.deliveryPercentage || 100,
      expectedDeliveryDate: item.expectedDeliveryDate ? item.expectedDeliveryDate.toISOString().split('T')[0] : undefined,
      minQuantity: item.minQuantity || 0,
      costPerUnit: item.costPerUnit || 0,
      barcode: item.barcode || "",
    }
  });

  // Initialize available cabinets based on initial location
  React.useEffect(() => {
    const selectedLocation = form.watch('location');
    if (selectedLocation) {
      setAvailableCabinets(
        cabinets.filter(cabinet => cabinet.locationId === selectedLocation)
      );
    }
  }, [form.watch('location'), cabinets]);

  const handleFormSubmit: SubmitHandler<FormValues> = (values) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
                    <Input {...field} />
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
                    <Input {...field} />
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
                    <FormLabel>Category*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit.id} value={unit.name}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cabinet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {availableCabinets.map(cabinet => (
                            <SelectItem key={cabinet.id} value={cabinet.id}>
                              {cabinet.name} {cabinet.isSecure && '🔒'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.name}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.name}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input 
                        type="number" 
                        min="1" 
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
                        min="0" 
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
                name="costPerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Per Unit ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
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

            {/* Full-width fields */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <AutocompleteInput {...field} suggestions={[]} className="min-h-[100px]" />
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
                    <AutocompleteInput {...field} suggestions={[]} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    defaultValue={field.value || OrderStatus.COMPLETED}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order status" />
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
                      <FormLabel>Delivery Percentage</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="relative">
                            <Slider
                              defaultValue={[field.value || 0]}
                              min={0}
                              max={100}
                              step={25}
                              onValueChange={(vals: number[]) => field.onChange(vals[0])}
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
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}