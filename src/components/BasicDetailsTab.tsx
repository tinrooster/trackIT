import React, { useState, useEffect } from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cabinet } from "@/types/cabinets";
import { CategoryNode, ItemWithSubcategories } from "@/types/inventory";

interface BasicDetailsTabProps {
  form: any;
  categories: CategoryNode[];
  locations: { id: string; name: string; }[];
  cabinets: Cabinet[];
  projects: ItemWithSubcategories[];
}

export const BasicDetailsTab = ({ form, categories, locations, cabinets, projects }: BasicDetailsTabProps) => {
  const [availableCabinets, setAvailableCabinets] = useState<Cabinet[]>([]);
  
  // Update available cabinets when location changes
  useEffect(() => {
    const currentLocation = form.watch('location');
    const locationObj = locations.find(loc => loc.name === currentLocation);
    
    if (locationObj && cabinets) {
      const filtered = cabinets.filter(cab => cab.locationId === locationObj.id);
      console.log(`Found ${filtered.length} cabinets for location "${currentLocation}" (ID: ${locationObj.id})`);
      
      // Log all cabinets and their locationIds for debugging
      if (filtered.length === 0) {
        console.log('All cabinets:', cabinets.map(c => ({ id: c.id, name: c.name, locationId: c.locationId })));
      }
      
      setAvailableCabinets(filtered);
      
      // If there's a cabinet selected but it's not in the filtered list, clear it
      const currentCabinet = form.watch('cabinet');
      if (currentCabinet && !filtered.some(cab => cab.id === currentCabinet)) {
        form.setValue('cabinet', '');
      }
    } else {
      console.log(`No cabinets found for location "${currentLocation}" (location object found: ${!!locationObj})`);
      setAvailableCabinets([]);
      form.setValue('cabinet', '');
    }
  }, [form.watch('location'), locations, cabinets, form]);

  // Get subcategories when a category is selected
  const subcategories = React.useMemo(() => {
    const category = form.watch('category');
    const categoryNode = categories.find(c => c.name === category);
    return categoryNode?.children || [];
  }, [form.watch('category'), categories]);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name*</FormLabel>
            <Input {...field} placeholder="Enter item name" />
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-2 gap-4">
        {/* Category and Subcategory pair */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category*</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('subcategory', '');
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name}
                        {cat.children && cat.children.length > 0 && ' (Has Subcategories)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          {subcategories.length > 0 ? (
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub.name} value={sub.name}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="h-[76px]" /> /* Placeholder to maintain layout */
          )}
        </div>

        {/* Location field */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location*</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // Cabinet will be cleared in the useEffect
                }}
                value={field.value || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>
                      {loc.name}
                      {cabinets.some(cab => cab.locationId === loc.id) && ' (Has Storage)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cabinet field */}
        <FormField
          control={form.control}
          name="cabinet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cabinet</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ''}
                disabled={!form.watch('location') || availableCabinets.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !form.watch('location') 
                          ? "Select a location first"
                          : availableCabinets.length > 0 
                            ? "Select storage cabinet" 
                            : "No storage cabinets available"
                      } 
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCabinets.map((cab) => (
                    <SelectItem key={cab.id} value={cab.id}>
                      {cab.name}
                      {cab.description && ` - ${cab.description}`}
                      {cab.isSecure && ' 🔒'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableCabinets.length > 0 && (
                <FormDescription>
                  {availableCabinets.length} cabinet{availableCabinets.length !== 1 ? 's' : ''} available
                  {availableCabinets.some(cab => cab.isSecure) && ' (🔒 indicates secure cabinet)'}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Project field - full width */}
      <FormField
        control={form.control}
        name="project"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {projects.map((proj) => (
                  <SelectItem key={proj.id || proj.name} value={proj.name}>
                    {proj.name}
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
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <Input {...field} placeholder="Enter item description" />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}; 