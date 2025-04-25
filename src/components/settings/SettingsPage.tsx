import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { SettingsService, defaultSettingsSchema, DefaultSettings } from "@/lib/settingsService";

interface SettingsPageProps {
  activeTab?: "general" | "defaults" | "qr";
}

export function SettingsPage({ activeTab = "general" }: SettingsPageProps) {
  const form = useForm<DefaultSettings>({
    resolver: zodResolver(defaultSettingsSchema),
    defaultValues: SettingsService.loadDefaultSettings(),
  });

  const onSubmit = async (data: DefaultSettings) => {
    try {
      SettingsService.saveDefaultSettings(data);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    }
  };

  const renderGeneralSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Configure general inventory settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="defaultMinQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Minimum Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Default minimum quantity for new items
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultReorderLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Reorder Level</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Default reorder level for new items
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  const renderDefaultValues = () => (
    <Card>
      <CardHeader>
        <CardTitle>Default Values</CardTitle>
        <CardDescription>Set default values for new items</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="defaultLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Location</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Unit</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Category</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultOrderStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Order Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="partially_delivered">Partially Delivered</SelectItem>
                  <SelectItem value="backordered">Backordered</SelectItem>
                  <SelectItem value="on_order">On Order</SelectItem>
                  <SelectItem value="not_ordered">Not Ordered</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  const renderQRSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Settings</CardTitle>
        <CardDescription>Configure QR code tracking settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="enableQRTracking"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable QR Tracking</FormLabel>
                <FormDescription>
                  Enable QR code tracking for items and cabinets
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requireCheckoutForSecureCabinets"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Require Checkout</FormLabel>
                <FormDescription>
                  Require checkout process for secure cabinets
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="autoGenerateQRCodes"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Auto-generate QR Codes</FormLabel>
                <FormDescription>
                  Automatically generate QR codes for new items and cabinets
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {activeTab === "general" && renderGeneralSettings()}
        {activeTab === "defaults" && renderDefaultValues()}
        {activeTab === "qr" && renderQRSettings()}
        
        <div className="flex justify-end">
          <Button type="submit">Save Settings</Button>
        </div>
      </form>
    </Form>
  );
} 