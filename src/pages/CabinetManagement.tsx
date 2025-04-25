import * as React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { Pencil, Trash2 } from "lucide-react"

interface Cabinet {
  id: string;
  name: string;
  locationId: string;
  description: string;
  isSecure: boolean;
  allowedCategories: string[];
  qrCode: string;
}

interface CabinetCheckout {
  cabinetId: string;
  itemId: string;
  quantity: number;
  timestamp: string;
  userId: string;
  status: 'checked-out' | 'returned';
}

interface DefaultSettings {
  defaultLocation: string;
  defaultUnit: string;
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

const generateQRCode = (cabinetId: string): string => {
  // Generate a simple unique identifier instead of QR code
  return `cabinet-${cabinetId}-${Date.now()}`;
};

export default function CabinetManagement({ locations }: CabinetManagementProps) {
  const [activeTab, setActiveTab] = React.useState('cabinets')
  const [cabinets, setCabinets] = React.useState<Cabinet[]>([])
  const [settings, setSettings] = React.useState<DefaultSettings>({
    defaultLocation: locations[0] || '',
    defaultUnit: 'pieces',
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
    qrCode: ''
  })

  const [editingCabinet, setEditingCabinet] = React.useState<Cabinet | null>(null);

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
      qrCode: ''
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
              <CardTitle>{editingCabinet ? 'Edit Cabinet' : 'Add New Cabinet'}</CardTitle>
              <CardDescription>
                {editingCabinet 
                  ? 'Edit cabinet details and security settings' 
                  : 'Create a new cabinet with security settings and category restrictions'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cabinet ID (max 8 chars)*</Label>
                    <Input 
                      value={cabinetForm.id}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        if (value.length <= 8) {
                          setCabinetForm({...cabinetForm, id: value});
                        }
                      }}
                      placeholder="E1"
                      maxLength={8}
                      className="font-mono w-[8ch]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name*</Label>
                    <Input 
                      value={cabinetForm.name}
                      onChange={(e) => setCabinetForm({...cabinetForm, name: e.target.value})}
                      placeholder="Cabinet Name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    value={cabinetForm.description}
                    onChange={(e) => setCabinetForm({...cabinetForm, description: e.target.value})}
                    placeholder="Cabinet description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location*</Label>
                  <Select 
                    value={cabinetForm.locationId}
                    onValueChange={(value) => setCabinetForm({...cabinetForm, locationId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
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
                    checked={cabinetForm.isSecure}
                    onCheckedChange={(checked) => setCabinetForm({...cabinetForm, isSecure: checked})}
                  />
                  <Label>Secure Cabinet</Label>
                </div>
                <Button 
                  type="button"
                  onClick={() => {
                    console.log('Save button clicked manually');
                    handleSaveCabinet();
                    setEditingCabinet(null);
                  }}
                  className="w-full"
                >
                  {editingCabinet ? 'Update Cabinet' : 'Save Cabinet'}
                </Button>
                {editingCabinet && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingCabinet(null);
                      setCabinetForm({
                        id: '',
                        name: '',
                        locationId: locations[0] || '',
                        description: '',
                        isSecure: false,
                        allowedCategories: [],
                        qrCode: ''
                      });
                    }}
                    className="w-full mt-2"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Cabinets</CardTitle>
              <CardDescription>Manage your cabinets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cabinets.map((cabinet) => (
                  <div key={cabinet.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{cabinet.name}</h3>
                          <p className="text-sm text-muted-foreground">{cabinet.description}</p>
                          <p className="text-sm">Location: {cabinet.locationId}</p>
                          {cabinet.isSecure && (
                            <p className="text-sm text-yellow-600">Secure Cabinet</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCabinet(cabinet)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCabinet(cabinet.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {cabinets.length === 0 && (
                  <p className="text-center text-muted-foreground">No cabinets added yet</p>
                )}
              </div>
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

              <div className="space-y-2">
                <Label>Default Unit</Label>
                <Select 
                  value={settings.defaultUnit}
                  onValueChange={(value) => handleUpdateSettings({ defaultUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
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