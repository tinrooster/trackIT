import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Save, User, Lock, Camera, FileDown, FileUp } from 'lucide-react';
import { CameraSettingsDialog } from './CameraSettingsDialog';
import { EditableItemList } from './EditableItemList';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ImportDialog } from '@/components/ImportDialog';
import { ExportDialog } from '@/components/ExportDialog';
import { InventoryItem } from '@/types/inventory';
import { v4 as uuidv4 } from 'uuid';

export default function SettingsPage() {
  const { user, logout, isPersistent, setPersistence } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [isCameraSettingsOpen, setIsCameraSettingsOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Get categories, locations, units, etc. from localStorage
  const [categories, setCategories] = useLocalStorage<string[]>('inventoryCategories', []);
  const [locations, setLocations] = useLocalStorage<string[]>('inventoryLocations', []);
  const [units, setUnits] = useLocalStorage<string[]>('inventoryUnits', []);
  const [projects, setProjects] = useLocalStorage<string[]>('inventoryProjects', []);
  const [suppliers, setSuppliers] = useLocalStorage<string[]>('inventorySuppliers', []);
  const [items, setItems] = useLocalStorage<InventoryItem[]>('inventoryItems', []);

  const handlePersistenceChange = (checked: boolean) => {
    setPersistence(checked);
    toast.success(`Remember login ${checked ? 'enabled' : 'disabled'}`);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      setIsChangingPassword(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      // In a real app, you would call an API endpoint here
      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
    }, 1000);
  };

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all inventory data? This cannot be undone.")) {
      localStorage.removeItem('inventoryItems');
      localStorage.removeItem('inventoryHistory');
      toast.success("All inventory data has been cleared");
      // Force reload to update the UI
      window.location.reload();
    }
  };

  // Handle importing items
  const handleImport = async (itemsToImport: Partial<InventoryItem>[]): Promise<{ importedCount: number; skippedCount: number }> => {
    let importedCount = 0;
    let skippedCount = 0;
    
    const newItems = itemsToImport.map(itemData => {
      // Check if this item might be a duplicate (by name and unit)
      const potentialDuplicate = items.find(
        existingItem => 
          existingItem.name.toLowerCase() === itemData.name?.toLowerCase() && 
          existingItem.unit.toLowerCase() === itemData.unit?.toLowerCase()
      );
      
      if (potentialDuplicate) {
        skippedCount++;
        return null; // Skip this item
      }
      
      importedCount++;
      return {
        ...itemData,
        id: uuidv4(),
        lastUpdated: new Date(),
        createdBy: user?.id,
        lastModifiedBy: user?.id
      } as InventoryItem;
    }).filter((item): item is InventoryItem => item !== null);
    
    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
    }
    
    return Promise.resolve({ importedCount, skippedCount });
  };

  // Handle import completion
  const handleImportComplete = (importedCount: number, skippedCount: number) => {
    setIsImportDialogOpen(false);
    
    if (importedCount > 0) {
      toast.success(`Imported ${importedCount} items successfully`);
    }
    
    if (skippedCount > 0) {
      toast.warning(`Skipped ${skippedCount} potential duplicate items`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="lists">Manage Lists</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View and manage your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Username</Label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.username}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label>Display Name</Label>
                <div>{user?.displayName}</div>
              </div>
              
              <div className="space-y-1">
                <Label>Role</Label>
                <div className="capitalize">{user?.role}</div>
              </div>

              <Separator className="my-4" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="persistence-mode">Remember Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Stay logged in between browser sessions
                  </p>
                </div>
                <Switch 
                  id="persistence-mode" 
                  checked={isPersistent}
                  onCheckedChange={handlePersistenceChange}
                />
              </div>

              <Separator className="my-4" />

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>Changing Password...</>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </>
                  )}
                </Button>
              </form>

              <Separator className="my-4" />
              
              <Button 
                variant="destructive" 
                onClick={logout}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="application" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Customize how the application works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Camera Settings</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Configure which camera to use for barcode scanning
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCameraSettingsOpen(true)}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Configure Camera
                  </Button>
                </div>

                <Separator />

                <div>
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Choose your preferred theme
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" className="justify-start">Light</Button>
                    <Button variant="outline" className="justify-start">Dark</Button>
                    <Button variant="outline" className="justify-start">System</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Lists</CardTitle>
              <CardDescription>
                Edit categories, locations, units, and other lists used in the inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="categories" className="w-full">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="locations">Locations</TabsTrigger>
                  <TabsTrigger value="units">Units</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                </TabsList>
                
                <TabsContent value="categories">
                  <EditableItemList 
                    items={categories} 
                    setItems={setCategories} 
                    title="Categories" 
                    description="Manage categories for organizing your inventory items"
                  />
                </TabsContent>
                
                <TabsContent value="locations">
                  <EditableItemList 
                    items={locations} 
                    setItems={setLocations} 
                    title="Locations" 
                    description="Manage storage locations for your inventory items"
                  />
                </TabsContent>
                
                <TabsContent value="units">
                  <EditableItemList 
                    items={units} 
                    setItems={setUnits} 
                    title="Units" 
                    description="Manage measurement units for your inventory items"
                  />
                </TabsContent>
                
                <TabsContent value="projects">
                  <EditableItemList 
                    items={projects} 
                    setItems={setProjects} 
                    title="Projects" 
                    description="Manage projects associated with your inventory items"
                  />
                </TabsContent>
                
                <TabsContent value="suppliers">
                  <EditableItemList 
                    items={suppliers} 
                    setItems={setSuppliers} 
                    title="Suppliers" 
                    description="Manage suppliers for your inventory items"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Import, export, and manage your inventory data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Export Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Export your inventory data to a file
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsExportDialogOpen(true)}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export All Data
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Import Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Import inventory data from a file
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsImportDialogOpen(true)}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    Import Data
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Label>Danger Zone</Label>
                <p className="text-sm text-muted-foreground">
                  These actions cannot be undone
                </p>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={clearAllData}
                >
                  Clear All Inventory Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CameraSettingsDialog 
        isOpen={isCameraSettingsOpen}
        onClose={() => setIsCameraSettingsOpen(false)}
      />

      {/* Import Dialog */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImport}
        onComplete={handleImportComplete}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        items={items}
      />
    </div>
  );
}