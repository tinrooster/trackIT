import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Cabinet, cabinetSchema } from "@/types/cabinets";
import { SettingsService } from "@/lib/settingsService";
import { ItemUpdateService } from "@/lib/itemUpdateService";
import { QRCodeSVG } from "qrcode.react";
import { InventoryItem } from "@/types/inventory";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CabinetManagerProps {
  locations: { id: string; name: string }[];
  categories: string[];
  items: InventoryItem[];
  onCabinetChange?: () => void;
}

export function CabinetManager({ locations, categories, items, onCabinetChange }: CabinetManagerProps) {
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const form = useForm<Cabinet>({
    resolver: zodResolver(cabinetSchema),
    defaultValues: {
      id: "",
      name: "",
      locationId: "",
      description: "",
      isSecure: false,
      allowedCategories: [],
    },
  });

  useEffect(() => {
    loadCabinets();
  }, []);

  const loadCabinets = async () => {
    const loadedCabinets = await SettingsService.getCabinets();
    setCabinets(loadedCabinets);
  };

  const onSubmit = async (data: Cabinet) => {
    try {
      await SettingsService.saveCabinet(data);
      toast.success("Cabinet saved successfully");
      loadCabinets();
      setIsDialogOpen(false);
      onCabinetChange?.();
    } catch (error) {
      toast.error("Failed to save cabinet");
      console.error(error);
    }
  };

  const handleDelete = async (cabinetId: string) => {
    try {
      // Update items that reference this cabinet
      const updatedItems = await ItemUpdateService.handleCabinetUpdate(
        cabinetId,
        items,
        { deleteReferences: true }
      );

      // Delete the cabinet
      await SettingsService.deleteCabinet(cabinetId);
      
      toast.success("Cabinet deleted successfully");
      loadCabinets();
      onCabinetChange?.();
    } catch (error) {
      toast.error("Failed to delete cabinet");
      console.error(error);
    }
  };

  const handleEdit = (cabinet: Cabinet) => {
    setSelectedCabinet(cabinet);
    form.reset(cabinet);
    setIsDialogOpen(true);
  };

  const handleGenerateQR = (cabinet: Cabinet) => {
    setSelectedCabinet(cabinet);
    setShowQRCode(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cabinet Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedCabinet(null);
              form.reset({
                id: crypto.randomUUID(),
                name: "",
                locationId: "",
                description: "",
                isSecure: false,
                allowedCategories: [],
              });
            }}>
              Add Cabinet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCabinet ? "Edit Cabinet" : "Add New Cabinet"}</DialogTitle>
              <DialogDescription>
                {selectedCabinet 
                  ? "Edit the cabinet details below"
                  : "Enter the details for the new cabinet"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., A1, B2, E1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location) => (
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Cabinet description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isSecure"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Secure Cabinet</FormLabel>
                        <FormDescription>
                          Require checkout process for items in this cabinet
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
                  name="allowedCategories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allowed Categories</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            const current = field.value || [];
                            if (current.includes(value)) {
                              field.onChange(current.filter(v => v !== value));
                            } else {
                              field.onChange([...current, value]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select categories" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Selected: {(field.value || []).join(", ")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">
                    {selectedCabinet ? "Save Changes" : "Add Cabinet"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Secure</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cabinets.map((cabinet) => (
            <TableRow key={cabinet.id}>
              <TableCell>{cabinet.name}</TableCell>
              <TableCell>
                {locations.find(l => l.id === cabinet.locationId)?.name}
              </TableCell>
              <TableCell>{cabinet.description}</TableCell>
              <TableCell>{cabinet.isSecure ? "Yes" : "No"}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(cabinet)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateQR(cabinet)}
                  >
                    QR Code
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(cabinet.id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cabinet QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to quickly identify the cabinet
            </DialogDescription>
          </DialogHeader>
          {selectedCabinet && (
            <div className="flex flex-col items-center space-y-4">
              <QRCodeSVG
                value={ItemUpdateService.generateCabinetQRCode(selectedCabinet)}
                size={200}
                level="H"
                includeMargin
              />
              <p className="text-sm text-muted-foreground">
                Cabinet: {selectedCabinet.name}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 