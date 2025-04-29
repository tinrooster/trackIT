"use client";

import * as React from 'react';
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ensureUrlProtocol } from "@/utils/url";
import { InventoryItem, OrderStatus, CategoryNode, ItemWithSubcategories } from "@/types/inventory";
import { Cabinet } from "@/types/cabinets";
import { Slider } from "@/components/ui/slider";
import { BasicDetailsTab } from "./BasicDetailsTab";

// Enhanced form schema with stricter validation
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  location: z.string().min(1, "Location is required"),
  locationSubcategory: z.string().optional(),
  cabinet: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  supplier: z.string().optional(),
  supplierWebsite: z.string()
    .transform((val) => val ? ensureUrlProtocol(val.trim()) : '')
    .optional(),
  project: z.string().optional(),
  notes: z.string().optional(),
  orderStatus: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: "Please select a valid order status" })
  }).default(OrderStatus.COMPLETED),
  deliveryPercentage: z.coerce.number().min(0).max(100).default(100),
  expectedDeliveryDate: z.string().optional(),
  minQuantity: z.coerce
    .number()
    .min(0, "Minimum quantity cannot be negative")
    .optional()
    .transform(val => val === 0 ? undefined : val),
  costPerUnit: z.coerce.number().min(0).optional(),
  barcode: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  modelNumber: z.string().optional(),
  dateInService: z.string().optional(),
  maintenanceNotes: z.string().optional(),
  unitSubcategory: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Add type definitions and helper functions at the top of the file
interface CategoryMap {
  [key: string]: string[];
}

const categorySubcategoryMap: CategoryMap = {
  'Electronics': ['Computers', 'Phones', 'Accessories'],
  'Office Supplies': ['Paper', 'Writing Tools', 'Organization'],
  'Lab Equipment': ['Microscopes', 'Glassware', 'Safety Equipment'],
  // Add more categories and subcategories as needed
};

const getSubcategoriesForCategory = (category: string, categories: CategoryNode[]): string[] => {
  const categoryNode = categories.find(c => c.name === category);
  return categoryNode?.children?.map(child => child.name) || [];
};

// Add arrays for existing values (these should be passed as props in practice)
// const existingManufacturers: string[] = [];
// const existingSuppliers: string[] = [];
// const existingProjects: string[] = [];

interface EditItemFormProps {
  item: InventoryItem;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  categories: CategoryNode[];
  units: ItemWithSubcategories[];
  locations: { id: string; name: string; }[];
  suppliers: ItemWithSubcategories[];
  projects: ItemWithSubcategories[];
  cabinets: Cabinet[];
  isSubmitting?: boolean;
  existingItems: InventoryItem[];
  existingManufacturers?: string[];
  existingSuppliers?: string[];
  existingProjects?: string[];
}

type ComboboxOption = {
  label: string;
  value: string;
};

// Add type for the onChange handler
type ComboboxChangeHandler = (value: string) => void;

function getUniqueValues(items: InventoryItem[], field: keyof InventoryItem): string[] {
  const values = items
    .map(item => item[field])
    .filter((value): value is string => 
      typeof value === 'string' && value.trim() !== ''
    );
  return Array.from(new Set(values));
}

// Create separate components for each tab to reduce nesting
const InventorySupplyTab = ({ form, units, suppliers }: { 
  form: any; 
  units: ItemWithSubcategories[];
  suppliers: any[];
}) => {
  // Get unit subcategories when a main unit is selected
  const unitSubcategories = React.useMemo(() => {
    const selectedUnit = form.watch('unit');
    const unitItem = units.find(u => u.name === selectedUnit);
    return unitItem?.children || [];
  }, [form.watch('unit'), units]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Unit fields with subcategories */}
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit*</FormLabel>
              <Select
                onValueChange={(value) => {
                  if (value !== field.value) {
                    field.onChange(value);
                    // Clear unit subcategory when main unit changes
                    form.setValue('unitSubcategory', '');
                  }
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.name} value={unit.name}>
                      {unit.name}
                      {unit.children && unit.children.length > 0 && ' (Has Subcategories)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {unitSubcategories.length > 0 && (
          <FormField
            control={form.control}
            name="unitSubcategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Size</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {unitSubcategories.map((subUnit: ItemWithSubcategories) => (
                      <SelectItem key={subUnit.name} value={subUnit.name}>
                        {subUnit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {form.watch('unit')} sizes available
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Quantity fields */}
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity*</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0"
                  step="1"
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
                  step="1"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? undefined : Number(e.target.value);
                    field.onChange(val);
                  }}
                />
              </FormControl>
              <FormDescription>
                Leave empty or set to 0 for no minimum quantity alert
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Supplier fields */}
        <FormField
          control={form.control}
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup.name} value={sup.name}>
                      {sup.name}
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
          name="supplierWebsite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Website</FormLabel>
              <FormControl>
                <Input 
                  type="url" 
                  {...field} 
                  placeholder="https://supplier.com"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

const AdditionalInfoTab = ({ form }: { form: any }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barcode</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter barcode" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serialNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serial Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter serial number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="manufacturer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manufacturer</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter manufacturer" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="modelNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter model number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateInService"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date In Service</FormLabel>
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
      </div>

      <FormField
        control={form.control}
        name="maintenanceNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maintenance Notes</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter maintenance notes" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Notes</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter additional notes" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export function EditItemForm({
  item,
  onSubmit: handleSubmit,
  onCancel,
  categories,
  units,
  locations,
  suppliers,
  projects,
  cabinets,
  isSubmitting = false,
  existingItems = [],
  existingManufacturers = [],
  existingSuppliers = [],
  existingProjects = [],
}: EditItemFormProps) {
  const [activeTab, setActiveTab] = useState("details");

  // Find the location name for the initial value
  const initialLocationName = React.useMemo(() => {
    const locationObj = locations.find(loc => loc.id === item.location);
    console.log(`Initial location ID: ${item.location}, found name: ${locationObj?.name || 'NOT FOUND'}`);
    return locationObj?.id || '';
  }, [item.location, locations]);

  const defaultValues = React.useMemo(() => {
    // Handle expected delivery date format
    let expectedDeliveryDate = item.expectedDeliveryDate;
    if (expectedDeliveryDate) {
      if (expectedDeliveryDate instanceof Date) {
        expectedDeliveryDate = expectedDeliveryDate.toISOString().split('T')[0];
      } else if (typeof expectedDeliveryDate === 'string') {
        // Ensure it's in YYYY-MM-DD format
        try {
          expectedDeliveryDate = new Date(expectedDeliveryDate).toISOString().split('T')[0];
        } catch (e) {
          expectedDeliveryDate = '';
        }
      }
    }

    // Handle date in service format 
    let dateInService = item.dateInService;
    if (dateInService) {
      if (dateInService instanceof Date) {
        dateInService = dateInService.toISOString().split('T')[0];
      } else if (typeof dateInService === 'string') {
        try {
          dateInService = new Date(dateInService).toISOString().split('T')[0];
        } catch (e) {
          dateInService = '';
        }
      }
    }

    return {
      name: item.name || '',
      description: item.description || '',
      category: item.category || '',
      subcategory: item.subcategory || '',
      unit: item.unit || '',
      location: initialLocationName, // Use location ID
      locationSubcategory: item.locationSubcategory || '',
      cabinet: item.cabinet || '',
      quantity: item.quantity || 0,
      supplier: item.supplier || '',
      supplierWebsite: item.supplierWebsite || '',
      project: item.project || '',
      notes: item.notes || '',
      orderStatus: item.orderStatus || OrderStatus.COMPLETED,
      deliveryPercentage: item.deliveryPercentage || 100,
      expectedDeliveryDate,
      minQuantity: item.minQuantity || 0,
      costPerUnit: item.costPerUnit || 0,
      barcode: item.barcode || '',
      serialNumber: item.serialNumber || '',
      manufacturer: item.manufacturer || '',
      modelNumber: item.modelNumber || '',
      dateInService,
      maintenanceNotes: item.maintenanceNotes || '',
      unitSubcategory: item.unitSubcategory || '',
    };
  }, [item, initialLocationName]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Add debugging to show form validation state
  const formState = form.formState;
  React.useEffect(() => {
    console.log("Form is valid:", formState.isValid);
    console.log("Form errors:", formState.errors);
    
    // Check all required fields
    const requiredFields = ['name', 'category', 'unit', 'location'];
    requiredFields.forEach(field => {
      const value = form.getValues(field as any);
      console.log(`Field ${field}: "${value || ''}" (${value ? 'valid' : 'invalid'})`);
    });
  }, [formState.isValid, formState.errors, form]);

  const onSubmit = (values: FormValues) => {
    // Convert location name back to ID before submitting
    const locationObj = locations.find(loc => loc.name === values.location);
    const locationId = locationObj?.id || '';
    console.log(`Submitting form: location name "${values.location}" → ID: ${locationId}`);
    
    handleSubmit({
      ...values,
      location: locationId // Use the location ID instead of name
    });
  };

  // Modify the getFieldSuggestions function to be more type-safe
  const getFieldSuggestions = (field: keyof InventoryItem, currentValue: string = ''): ComboboxOption[] => {
    const values = getUniqueValues(existingItems, field);
    return values
      .filter(value => 
        value.toLowerCase().includes(currentValue.toLowerCase())
      )
      .map(value => ({
        label: value,
        value: value,
      }));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <AdditionalInfoTab form={form} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={false}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}