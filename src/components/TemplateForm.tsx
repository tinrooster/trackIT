import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ItemTemplate } from "@/types/templates";
import { useToast } from "@/components/ui/use-toast";

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
}

export function TemplateForm({ template, onSubmit, onCancel }: TemplateFormProps) {
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
              <Input {...field} placeholder="Enter category" />
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
              <Input {...field} placeholder="Enter unit (e.g., pcs, kg)" />
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
              <Input {...field} placeholder="Enter default location" />
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
              <Input {...field} placeholder="Enter default supplier" />
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