import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useInventory } from "@/hooks/useInventory";

const formSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.coerce.number().min(1, "Quantity must be greater than 0"),
  action: z.enum(["check-in", "check-out"]),
});

type FormSchema = z.infer<typeof formSchema>;

interface ItemCheckInOutProps {
  cabinetId: string;
  cabinetName: string;
  isSecure: boolean;
  locationId: string;
  onCheckIn: (itemId: string, quantity: number) => void;
  onCheckOut: (itemId: string, quantity: number) => void;
}

export function ItemCheckInOut({ 
  cabinetId, 
  cabinetName, 
  isSecure,
  locationId,
  onCheckIn,
  onCheckOut 
}: ItemCheckInOutProps) {
  const { items } = useInventory();
  
  const locationItems = React.useMemo(() => {
    return items.filter(item => item.location === locationId);
  }, [items, locationId]);
  
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemId: "",
      quantity: 1,
      action: "check-out",
    },
  });

  const onSubmit = (values: FormSchema) => {
    if (values.action === "check-in") {
      onCheckIn(values.itemId, values.quantity);
    } else {
      onCheckOut(values.itemId, values.quantity);
    }
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Check items in or out of {cabinetName}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locationItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.quantity || 0} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {locationItems.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      No items found for this location. Add items to this location first.
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="check-out">Check Out</SelectItem>
                      <SelectItem value="check-in">Check In</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={locationItems.length === 0}>
                Submit
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 