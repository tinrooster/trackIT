import * as React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { Pencil, Trash2, GripVertical } from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QRCodeManager } from "@/components/cabinets/QRCodeManager";
import { CheckoutHistory } from "@/components/cabinets/CheckoutHistory";

interface Cabinet {
  id: string;
  name: string;
  locationId: string;
  description: string;
  isSecure: boolean;
  allowedCategories: string[];
  qrCode: string;
  notes?: string;
}

interface CabinetCheckout {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  timestamp: string;
  userId: string;
  userName: string;
  type: 'check-in' | 'check-out';
}

interface DefaultSettings {
  defaultLocation: string;
  enableQRTracking: boolean;
  requireCheckoutForSecureCabinets: boolean;
}

interface Location {
  id: string;
  name: string;
}

interface CabinetManagementProps {
  locations: string[];
}

interface SortableCabinetProps {
  cabinet: Cabinet;
  onEdit: (cabinet: Cabinet) => void;
  onDelete: (id: string) => void;
}

const generateQRCode = (cabinetId: string): string => {
  // Generate a simple unique identifier instead of QR code
  return `cabinet-${cabinetId}-${Date.now()}`;
};

// Add SortableCabinet component
function SortableCabinet({ cabinet, onEdit, onDelete }: SortableCabinetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: cabinet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-white rounded-lg shadow mb-2">
      <div {...attributes} {...listeners} className="cursor-move">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{cabinet.name}</h3>
        <p className="text-sm text-gray-500">{cabinet.description}</p>
        {cabinet.notes && <p className="text-sm text-gray-400 mt-1">{cabinet.notes}</p>}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(cabinet)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(cabinet.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function CabinetManagement({ locations }: CabinetManagementProps) {
  const [activeTab, setActiveTab] = React.useState('cabinets')
  const [cabinets, setCabinets] = React.useState<Cabinet[]>([])
  const [settings, setSettings] = React.useState<DefaultSettings>({
    defaultLocation: locations[0] || '',
    enableQRTracking: true,
    requireCheckoutForSecureCabinets: true
  })

  // Cabinet form state
  const [cabinetForm, setCabinetForm] = React.useState<Cabinet>({
    id: '',
    name: '',
    locationId: locations[0] || '',
    description: '',
    isSecure: false,
    allowedCategories: [],
    qrCode: '',
    notes: ''
  })

  const [editingCabinet, setEditingCabinet] = React.useState<Cabinet | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [checkoutHistory, setCheckoutHistory] = React.useState<Record<string, CabinetCheckout[]>>({});

  // Load cabinets from localStorage
  React.useEffect(() => {
    try {
      const savedCabinets = localStorage.getItem('cabinets');
      console.log('Loading saved cabinets:', savedCabinets);
      if (savedCabinets) {
        const parsed = JSON.parse(savedCabinets);
        console.log('Parsed cabinets:', parsed);
        setCabinets(parsed);
      }
    } catch (error) {
      console.error('Error loading cabinets:', error);
      toast.error("Failed to load cabinets");
    }
  }, []);

  // Save cabinets to localStorage
  const saveCabinets = (newCabinets: Cabinet[]) => {
    try {
      console.log('Attempting to save cabinets:', newCabinets);
      localStorage.setItem('cabinets', JSON.stringify(newCabinets));
      setCabinets(newCabinets);
      console.log('Cabinets saved successfully');
    } catch (error) {
      console.error('Error saving cabinets:', error);
      toast.error("Failed to save cabinet");
    }
  };

  // Update default location when locations list changes
  React.useEffect(() => {
    if (locations.length > 0 && !locations.includes(settings.defaultLocation)) {
      setSettings(prev => ({ ...prev, defaultLocation: locations[0] }))
    }
    if (locations.length > 0 && !locations.includes(cabinetForm.locationId)) {
      setCabinetForm(prev => ({ ...prev, locationId: locations[0] }))
    }
  }, [locations])

  const handleSaveCabinet = () => {
    console.log('Save button clicked');
    console.log('Current form state:', cabinetForm);
    
    if (!cabinetForm.id.trim() || !cabinetForm.name.trim() || !cabinetForm.locationId) {
      console.log('Validation failed:', {
        id: !cabinetForm.id.trim(),
        name: !cabinetForm.name.trim(),
        locationId: !cabinetForm.locationId
      });
      toast.error("Cabinet ID, name, and location are required");
      return;
    }

    if (cabinetForm.id.length > 8) {
      toast.error("Cabinet ID must be 8 characters or less");
      return;
    }

    // Trim and uppercase the ID
    const formattedId = cabinetForm.id.trim().toUpperCase();

    // Only check for duplicate ID if we're not editing or if we're editing a different cabinet
    if (!editingCabinet && cabinets.some(cab => cab.id === formattedId)) {
      toast.error("Cabinet ID already exists");
      return;
    }

    const newCabinet = {
      ...cabinetForm,
      id: formattedId,
      name: cabinetForm.name.trim(),
      description: cabinetForm.description.trim(),
      notes: cabinetForm.notes?.trim(),
      qrCode: generateQRCode(formattedId)
    };

    console.log('Saving new cabinet:', newCabinet);
    
    if (editingCabinet) {
      // Update existing cabinet
      saveCabinets(cabinets.map(cab => cab.id === editingCabinet.id ? newCabinet : cab));
      toast.success("Cabinet updated successfully");
    } else {
      // Add new cabinet
      saveCabinets([...cabinets, newCabinet]);
      toast.success("Cabinet saved successfully");
    }
    
    // Reset form
    setCabinetForm({
      id: '',
      name: '',
      locationId: locations[0] || '',
      description: '',
      isSecure: false,
      allowedCategories: [],
      qrCode: '',
      notes: ''
    });
    
    setEditingCabinet(null);
  };

  const handleDeleteCabinet = (id: string) => {
    saveCabinets(cabinets.filter(cabinet => cabinet.id !== id));
    toast.success("Cabinet deleted successfully");
  }

  const handleUpdateSettings = (newSettings: Partial<DefaultSettings>) => {
    setSettings({ ...settings, ...newSettings })
  }

  const handleEditCabinet = (cabinet: Cabinet) => {
    setEditingCabinet(cabinet);
    setCabinetForm(cabinet);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id && over) {
      setCabinets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        saveCabinets(newOrder);
        return newOrder;
      });
    }
  };

  const handleCheckIn = async (cabinetId: string, itemId: string, quantity: number) => {
    try {
      // In a real app, you would make an API call here
      const newCheckout: CabinetCheckout = {
        id: Date.now().toString(),
        itemId,
        itemName: `Item ${itemId}`, // In real app, get from item database
        quantity,
        timestamp: new Date().toISOString(),
        userId: 'current-user', // In real app, get from auth context
        userName: 'Current User', // In real app, get from auth context
        type: 'check-in'
      };

      setCheckoutHistory(prev => ({
        ...prev,
        [cabinetId]: [...(prev[cabinetId] || []), newCheckout]
      }));

      toast.success('Item checked in successfully');
    } catch (error) {
      console.error('Error checking in item:', error);
      toast.error('Failed to check in item');
    }
  };

  const handleCheckOut = async (cabinetId: string, itemId: string, quantity: number) => {
    try {
      // In a real app, you would make an API call here
      const newCheckout: CabinetCheckout = {
        id: Date.now().toString(),
        itemId,
        itemName: `Item ${itemId}`, // In real app, get from item database
        quantity,
        timestamp: new Date().toISOString(),
        userId: 'current-user', // In real app, get from auth context
        userName: 'Current User', // In real app, get from auth context
        type: 'check-out'
      };

      setCheckoutHistory(prev => ({
        ...prev,
        [cabinetId]: [...(prev[cabinetId] || []), newCheckout]
      }));

      toast.success('Item checked out successfully');
    } catch (error) {
      console.error('Error checking out item:', error);
      toast.error('Failed to check out item');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cabinets">Cabinet List</TabsTrigger>
          <TabsTrigger value="settings">Cabinet Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="cabinets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Cabinet</CardTitle>
              <CardDescription>Create a new storage cabinet for inventory management.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" autoComplete="off">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cabinet-id">Cabinet ID</Label>
                      <Input
                        id="cabinet-id"
                        name="cabinet-id"
                        placeholder="Enter cabinet ID"
                        className="h-12 text-lg"
                        value={cabinetForm.id}
                        maxLength={8}
                        autoComplete="off"
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          setCabinetForm({...cabinetForm, id: value});
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="cabinet-name"
                        placeholder="Enter cabinet name"
                        className="h-12 text-lg"
                        value={cabinetForm.name}
                        maxLength={12}
                        autoComplete="off"
                        onChange={(e) => setCabinetForm({...cabinetForm, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="cabinet-description"
                      placeholder="Enter cabinet description"
                      className="h-12 text-lg"
                      value={cabinetForm.description}
                      autoComplete="off"
                      onChange={(e) => setCabinetForm({...cabinetForm, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      name="cabinet-notes"
                      placeholder="Enter additional notes about this cabinet"
                      className="w-full min-h-[100px] px-3 py-2 text-lg rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={cabinetForm.notes || ''}
                      autoComplete="off"
                      onChange={(e) => setCabinetForm({...cabinetForm, notes: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={cabinetForm.locationId}
                      onValueChange={(value) => setCabinetForm({...cabinetForm, locationId: value})}
                    >
                      <SelectTrigger id="location" name="cabinet-location" className="h-12 text-lg">
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="secure"
                      name="cabinet-secure"
                      checked={cabinetForm.isSecure}
                      onCheckedChange={(checked) => setCabinetForm({...cabinetForm, isSecure: checked})}
                    />
                    <Label htmlFor="secure">Secure Cabinet</Label>
                  </div>
                </div>
                <Button type="button" onClick={handleSaveCabinet}>
                  {editingCabinet ? 'Update Cabinet' : 'Add Cabinet'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Cabinets</CardTitle>
              <CardDescription>Manage and reorder your storage cabinets.</CardDescription>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={cabinets.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {cabinets.map((cabinet) => (
                    <div key={cabinet.id} className="space-y-4">
                      <SortableCabinet
                        cabinet={cabinet}
                        onEdit={handleEditCabinet}
                        onDelete={handleDeleteCabinet}
                      />
                      
                      {settings.enableQRTracking && (
                        <>
                          <QRCodeManager
                            cabinetId={cabinet.id}
                            cabinetName={cabinet.name}
                            isSecure={cabinet.isSecure}
                            requireCheckout={settings.requireCheckoutForSecureCabinets}
                            onCheckIn={(itemId, quantity) => handleCheckIn(cabinet.id, itemId, quantity)}
                            onCheckOut={(itemId, quantity) => handleCheckOut(cabinet.id, itemId, quantity)}
                          />
                          
                          <CheckoutHistory
                            cabinetId={cabinet.id}
                            records={checkoutHistory[cabinet.id] || []}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Settings</CardTitle>
              <CardDescription>Configure cabinet-wide default settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Location</Label>
                <Select 
                  value={settings.defaultLocation}
                  onValueChange={(value) => handleUpdateSettings({ defaultLocation: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.enableQRTracking}
                  onCheckedChange={(checked) => handleUpdateSettings({ enableQRTracking: checked })}
                />
                <Label>Enable QR Tracking</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.requireCheckoutForSecureCabinets}
                  onCheckedChange={(checked) => handleUpdateSettings({ requireCheckoutForSecureCabinets: checked })}
                />
                <Label>Require Checkout for Secure Cabinets</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}