"use client";

import React, { useState, useEffect } from 'react'; // Added useEffect
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItem } from "@/types/inventory";
import { PlusCircle, MinusCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label"; // Import Label directly

// Define separate schemas for different adjustment types
const addRemoveSchema = z.object({
  quantity: z.coerce.number()
    .min(0.01, { message: "Quantity must be greater than 0" }),
  reason: z.string()
    .min(2, { message: "Please provide a reason (min 2 chars)" })
    .max(200, { message: "Reason must be less than 200 characters" }),
});

const setSchema = z.object({
  quantity: z.coerce.number()
    .min(0, { message: "Quantity cannot be negative" }), // Allow 0 for setting exact
  reason: z.string()
    .min(2, { message: "Please provide a reason (min 2 chars)" })
    .max(200, { message: "Reason must be less than 200 characters" }),
});

type AdjustmentFormValues = z.infer<typeof addRemoveSchema> | z.infer<typeof setSchema>;

interface InventoryAdjustmentProps {
  item: InventoryItem;
  onAdjust: (itemId: string, newQuantity: number, reason: string) => void;
}

export function InventoryAdjustment({ item, onAdjust }: InventoryAdjustmentProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');

  // Determine the correct schema based on adjustment type
  const currentSchema = adjustmentType === 'set' ? setSchema : addRemoveSchema;

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      quantity: adjustmentType === 'set' ? item.quantity : 1, // Default to current for 'set'
      reason: "",
    },
    mode: "onChange", // Validate on change
  });

  // Reset form validation and default quantity when adjustment type changes
  useEffect(() => {
    form.reset({
        quantity: adjustmentType === 'set' ? item.quantity : 1,
        reason: ""
    });
    // Need to explicitly trigger re-validation against the new schema
    form.trigger();
  }, [adjustmentType, item.quantity, form]);


  const handleSubmit = (values: AdjustmentFormValues) => {
    let newQuantity: number;
    const adjustmentQuantity = Number(values.quantity); // Ensure it's a number

    switch (adjustmentType) {
      case 'add':
        newQuantity = item.quantity + adjustmentQuantity;
        break;
      case 'remove':
        newQuantity = Math.max(0, item.quantity - adjustmentQuantity);
        break;
      case 'set':
        newQuantity = adjustmentQuantity;
        break;
      default:
        return;
    }

    onAdjust(item.id, newQuantity, values.reason);

    // Reset form after successful submission
    form.reset({
      quantity: adjustmentType === 'set' ? newQuantity : 1, // Update 'set' default to new value
      reason: "",
    });

    const action = adjustmentType === 'add' ? 'added to' :
                  adjustmentType === 'remove' ? 'removed from' : 'set for';
    toast.success(`Quantity ${action} ${item.name}`);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-medium">Adjust Inventory</h3>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Current Quantity:</span>
        <span className="text-lg font-bold">{item.quantity} {item.unit}</span>
      </div>

      <div className="flex space-x-2">
        <Button
          type="button" // Prevent form submission
          variant={adjustmentType === 'add' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAdjustmentType('add')}
        >
          <PlusCircle className="mr-1 h-4 w-4" />
          Add
        </Button>
        <Button
          type="button" // Prevent form submission
          variant={adjustmentType === 'remove' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAdjustmentType('remove')}
        >
          <MinusCircle className="mr-1 h-4 w-4" />
          Remove
        </Button>
        <Button
          type="button" // Prevent form submission
          variant={adjustmentType === 'set' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAdjustmentType('set')}
        >
          <RotateCcw className="mr-1 h-4 w-4" />
          Set Exact
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
         {/* Quantity Input - Always visible */}
         <div className="space-y-2">
            <Label htmlFor="quantity-input">
              {adjustmentType === 'add' ? 'Quantity to Add' :
               adjustmentType === 'remove' ? 'Quantity to Remove' :
               'New Quantity'}
            </Label>
            <Input
              id="quantity-input"
              type="number"
              min={adjustmentType === 'set' ? "0" : "0.01"} // Allow 0 only for 'set'
              step="any" // Allow decimals
              {...form.register("quantity")}
            />
            {form.formState.errors.quantity && (
                <p className="text-sm font-medium text-destructive mt-1">
                    {form.formState.errors.quantity.message}
                </p>
            )}
         </div>

         {/* Reason Input - Always visible */}
         <div className="space-y-2">
            <Label htmlFor="reason-input">Reason for Adjustment*</Label>
            <Textarea
              id="reason-input"
              placeholder="e.g., Used in project X, Received shipment, Count correction"
              className="resize-none"
              {...form.register("reason")}
            />
             {form.formState.errors.reason && (
                <p className="text-sm font-medium text-destructive mt-1">
                    {form.formState.errors.reason.message}
                </p>
            )}
         </div>

          <Button type="submit" className="w-full" disabled={!form.formState.isValid}>
            {adjustmentType === 'add' ? 'Add to Inventory' :
             adjustmentType === 'remove' ? 'Remove from Inventory' :
             'Update Inventory'}
          </Button>
      </form>
    </div>
  );
}