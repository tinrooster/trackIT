import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ItemTemplate } from "@/types/templates";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryNode, ItemWithSubcategories } from "@/types/inventory";

const templateFormSchema = z.object({
  templateName: z.string().min(2, "Template name must be at least 2 characters"),
  name: z.string().min(2, "Item name must be at least 2 characters"),
  description: z.string(),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  minQuantity: z.coerce.number().min(0).optional(),
  reorderLevel: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  supplierWebsite: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
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
  suppliers
}: TemplateFormProps) {
  const { toast } = useToast();
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      templateName: template?.templateName || "",
      name: template?.name || "",
      description: template?.description || "",
      category: template?.category || "",
      unit: template?.unit || "",
      minQuantity: template?.minQuantity,
      reorderLevel: template?.reorderLevel,
      location: template?.location || "",
      supplier: template?.supplier || "",
      supplierWebsite: template?.supplierWebsite || "",
      notes: template?.notes || "",
    },
  });

  const handleSubmit = (data: TemplateFormData) => {
    const templateData: ItemTemplate = {
      templateId: template?.templateId || crypto.randomUUID(),
      ...data,
      quantity: 0,
      costPerUnit: 0,
      price: 0,
      barcode: "",
      project: "",
      orderStatus: "not_ordered",
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="templateName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Name</FormLabel>
              <Input {...field} placeholder="Enter template name" />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <Input {...field} placeholder="Enter item name" />
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
              <Textarea {...field} placeholder="Enter description" />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Quantity</FormLabel>
                <Input type="number" {...field} placeholder="0" />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reorderLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Level</FormLabel>
                <Input type="number" {...field} placeholder="0" />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Location</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Supplier</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.name}>
                        {supplier.name}
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
              <Input {...field} placeholder="https://supplier.com" />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <Textarea {...field} placeholder="Enter any additional notes" />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {template ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 