import { useState, useEffect } from 'react'
import { Save, GripVertical, AlertCircle, Download, Upload, Trash2, Pencil, UserPlus, Shield, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getItems, saveItems, getSettings, saveSettings, STORAGE_KEYS } from '@/lib/storageService'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { InventoryItem, CategoryNode, ItemWithSubcategories } from '@/types/inventory'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/contexts/AuthContext'
import type { User, UserWithPassword } from '@/contexts/AuthContext'
import { Label } from "@/components/ui/label"
import { getPasswordError } from '@/utils/passwordUtils'
import { EditableItemWithSubcategoriesList } from '@/components/EditableItemWithSubcategoriesList'
import { CategoryTreeManager } from '@/components/CategoryTreeManager'
import { v4 as uuidv4 } from 'uuid'

// Sortable item component
function SortableItem({ 
  id, 
  value, 
  onRemove,
  onEdit
}: { 
  id: string, 
  value: string, 
  onRemove: () => void,
  onEdit: (oldValue: string, newValue: string) => void 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
  }

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onEdit(value, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
      <div className="flex items-center flex-1">
        <button {...attributes} {...listeners} className="p-1 mr-2 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        {isEditing ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-8"
            autoFocus
          />
        ) : (
          <span>{value}</span>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

// Add User Dialog Component
function EditUserDialog({ 
  open, 
  onOpenChange,
  user,
  onSave 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  user: User,
  onSave: (userId: string, updates: Partial<User>) => void 
}) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [role, setRole] = useState<'admin' | 'user' | 'viewer'>(user.role)

  useEffect(() => {
    setDisplayName(user.displayName);
    setRole(user.role);
  }, [user]);

  const handleSubmit = () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }
    
    onSave(user.id, {
      displayName: displayName.trim(),
      role
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={user.username}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={(value: 'admin' | 'user' | 'viewer') => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="user">Regular User</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddUserDialog({ 
  open, 
  onOpenChange,
  onAdd 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  onAdd: (user: Omit<UserWithPassword, 'id'>) => void 
}) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'user' | 'viewer'>('user')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [phoneExtension, setPhoneExtension] = useState('')

  const handleSubmit = () => {
    if (!username.trim() || !displayName.trim() || !password.trim() || !securityQuestion.trim() || !securityAnswer.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    onAdd({
      username: username.trim(),
      displayName: displayName.trim(),
      password: password.trim(),
      role,
      securityQuestion: securityQuestion.trim(),
      securityAnswer: securityAnswer.trim(),
      phoneExtension: phoneExtension.trim() || undefined
    });
    
    // Reset form
    setUsername('');
    setDisplayName('');
    setPassword('');
    setRole('user');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setPhoneExtension('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with specific permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Security Question</Label>
            <Input
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              placeholder="Enter security question for password reset"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Security Answer</Label>
            <Input
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              placeholder="Enter answer to security question"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Phone Extension (Optional)</Label>
            <Input
              value={phoneExtension}
              onChange={(e) => setPhoneExtension(e.target.value)}
              placeholder="Enter phone extension"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Role</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'user' | 'viewer') => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="user">Regular User</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Add User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add AdminResetPasswordDialog component
function AdminResetPasswordDialog({ 
  open, 
  onOpenChange,
  user,
  onReset 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  user: User,
  onReset: (username: string, newPassword: string) => Promise<void>
}) {
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setNewPassword('');
      setPasswordError(null);
    }
  }, [open]);

  // Validate password on change
  useEffect(() => {
    const error = getPasswordError(newPassword);
    setPasswordError(error);
  }, [newPassword]);

  const handleSubmit = async () => {
    const error = getPasswordError(newPassword);
    if (error) {
      toast.error(error);
      return;
    }

    await onReset(user.username, newPassword.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogDescription>
            Reset password for user {user.displayName} (@{user.username})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (minimum 4 characters)"
              className={passwordError ? "border-red-500" : ""}
            />
            {passwordError && (
              <p className="text-sm text-red-500 mt-1">{passwordError}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            type="button"
            disabled={!!passwordError || !newPassword}
          >
            Reset Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SettingsState {
  categories: ItemWithSubcategories[];
  units: ItemWithSubcategories[];
  locations: ItemWithSubcategories[];
  suppliers: ItemWithSubcategories[];
  projects: ItemWithSubcategories[];
}

type SettingsKey = keyof SettingsState;

interface ListInfo {
  list: ItemWithSubcategories[];
  title: string;
  key: SettingsKey;
  description: string;
}

const listInfo: Record<SettingsKey, { title: string; description: string }> = {
  categories: {
    title: 'Categories',
    description: 'Manage categories and subcategories for organizing your inventory items'
  },
  units: {
    title: 'Units',
    description: 'Manage units of measurement for your inventory items'
  },
  locations: {
    title: 'Locations',
    description: 'Manage storage locations for your inventory items'
  },
  suppliers: {
    title: 'Suppliers',
    description: 'Manage suppliers for your inventory items'
  },
  projects: {
    title: 'Projects',
    description: 'Manage projects for your inventory items'
  }
};

export default function SettingsPage() {
  const { user, logout, isPersistent, setPersistence, adminResetPassword } = useAuth();
  
  // Initialize states from URL parameters
  const [mainTab, setMainTab] = useState(() => {
    // Get tab from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    // If tab is 'users', set mainTab to 'users', otherwise default to 'lists'
    return tab === 'users' ? 'users' : 'lists';
  });
  
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return tab || 'categories';
  });

  // Update URL when tabs change
  useEffect(() => {
    const url = new URL(window.location.href);
    if (mainTab === 'users') {
      url.searchParams.set('tab', 'users');
    } else {
      url.searchParams.set('tab', activeTab);
    }
    window.history.replaceState({}, '', url.toString());
  }, [mainTab, activeTab]);

  const [settings, setSettings] = useState<SettingsState>({
    categories: [],
    units: [],
    locations: [],
    suppliers: [],
    projects: []
  });

  const [showReconcileDialog, setShowReconcileDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{type: string, value: string} | null>(null)
  const [affectedItemsCount, setAffectedItemsCount] = useState<number>(0)
  const [reconcileAction, setReconcileAction] = useState<'delete' | 'replace'>('delete')
  const [replacementValue, setReplacementValue] = useState('')
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resettingUser, setResettingUser] = useState<User | null>(null)

  const listMap: Record<SettingsKey, ListInfo> = {
    categories: { 
      list: settings.categories, 
      title: 'Categories', 
      key: 'categories',
      description: 'Manage categories and subcategories for organizing your inventory items'
    },
    units: { 
      list: settings.units, 
      title: 'Units', 
      key: 'units',
      description: 'Manage units'
    },
    locations: { 
      list: settings.locations, 
      title: 'Locations', 
      key: 'locations',
      description: 'Manage storage locations for your inventory items'
    },
    suppliers: { 
      list: settings.suppliers, 
      title: 'Suppliers', 
      key: 'suppliers',
      description: 'Manage suppliers for your inventory items'
    },
    projects: { 
      list: settings.projects, 
      title: 'Projects', 
      key: 'projects',
      description: 'Manage projects for your inventory items'
    }
  };

  const updateSettingsList = (key: SettingsKey, newValue: ItemWithSubcategories[]) => {
    setSettings(prev => ({
      ...prev,
      [key]: newValue
    }))
    // Update settings using the new interface
    saveSettings({
      ...settings,
      [key]: newValue
    });
  };

  useEffect(() => {
    const loadSettings = () => {
      // Use the new getSettings interface that returns all settings at once
      const savedSettings = getSettings();
      setSettings(savedSettings);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const savedUsers = localStorage.getItem('inventory-users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  const saveAllSettings = () => {
    try {
      // Use the new saveSettings interface that takes all settings at once
      saveSettings(settings);
      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    }
  }

  const saveUsers = (newUsers: User[]) => {
    localStorage.setItem('inventory-users', JSON.stringify(newUsers));
    setUsers(newUsers);
  };

  const handleAddItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (value && !list.includes(value)) {
      setList([...list, value]) // Add to end
    }
  }

  const handleRemoveItemCheck = (typeTitle: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    const items = getItems()
    const typeKey = listMap[activeTab as keyof typeof listMap].key as keyof InventoryItem;
    const affected = items.filter(item => item[typeKey] === value)

    if (affected.length > 0) {
      setItemToDelete({type: typeTitle, value}) // Store Title (e.g., "Categories")
      setAffectedItemsCount(affected.length)
      setReconcileAction('delete'); // Default action
      setReplacementValue(''); // Reset replacement value
      setShowReconcileDialog(true)
    } else {
      // No items affected, just remove
      setList(list.filter(item => item !== value))
    }
  }

  const handleReconcileConfirm = () => {
    if (!itemToDelete) return

    const { type, value } = itemToDelete
    const { list } = listMap[activeTab as keyof typeof listMap]
    const typeKey = type.toLowerCase()

    // 1. Update the settings list
    const newList = list.filter(item => item.name !== value)
    updateSettingsList(activeTab as SettingsKey, newList)

    // 2. Update affected inventory items
    const items = getItems()
    let updatedItems = items
    let toastMessage = ""

    if (reconcileAction === 'replace' && replacementValue) {
      updatedItems = items.map(item => {
        if (item[typeKey as keyof InventoryItem] === value) {
          return { ...item, [typeKey]: replacementValue }
        }
        return item
      })
      toastMessage = `Updated ${affectedItemsCount} items: Replaced "${value}" with "${replacementValue}" in ${type.toLowerCase()}.`
    } else { // 'delete' action
      updatedItems = items.map(item => {
        if (item[typeKey as keyof InventoryItem] === value) {
          const newItem = { ...item }
          delete newItem[typeKey as keyof InventoryItem]
          return newItem
        }
        return item
      })
      toastMessage = `Removed "${value}" from ${affectedItemsCount} items.`
    }

    saveItems(updatedItems)
    toast.success(toastMessage)

    setShowReconcileDialog(false)
    setItemToDelete(null)
    setAffectedItemsCount(0)
    setReplacementValue('')
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getCurrentListInfo = () => {
    const listMap: Record<string, { list: ItemWithSubcategories[]; settingsKey: SettingsKey }> = {
      categories: { list: settings.categories, settingsKey: 'categories' },
      units: { list: settings.units, settingsKey: 'units' },
      locations: { list: settings.locations, settingsKey: 'locations' },
      suppliers: { list: settings.suppliers, settingsKey: 'suppliers' },
      projects: { list: settings.projects, settingsKey: 'projects' }
    };
    return listMap[activeTab];
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const { list, settingsKey } = getCurrentListInfo();
      const oldIndex = list.findIndex(item => item.id === active.id);
      const newIndex = list.findIndex(item => item.id === over.id);

      const newList = arrayMove(list, oldIndex, newIndex);
      updateSettingsList(settingsKey, newList);
    }
  };

  const exportConfiguration = () => {
    const config = {
      ...settings,
      generalSettings: null, // We'll handle general settings separately if needed
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trackIT_config_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration Exported",
      description: "Your configuration has been exported successfully.",
    });
  };

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        
        // Validate the configuration structure
        const requiredKeys = ['categories', 'units', 'locations', 'suppliers', 'projects'];
        if (!requiredKeys.every(key => Array.isArray(config[key]))) {
          throw new Error('Invalid configuration format');
        }

        // Import all settings at once
        saveSettings({
          categories: config.categories,
          units: config.units,
          locations: config.locations,
          suppliers: config.suppliers,
          projects: config.projects
        });

        // Refresh the UI
        setSettings({
          categories: config.categories,
          units: config.units,
          locations: config.locations,
          suppliers: config.suppliers,
          projects: config.projects
        });

        toast({
          title: "Configuration Imported",
          description: "Your configuration has been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import configuration. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleEditItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, oldValue: string, newValue: string, key: keyof typeof STORAGE_KEYS) => {
    if (!newValue.trim() || list.includes(newValue.trim())) {
      toast.error(newValue.trim() ? "This value already exists" : "Please enter a value");
      return;
    }

    // Check if the item being edited is used in any inventory items
    const items = getItems();
    const typeKey = listMap[activeTab as keyof typeof listMap].key as keyof InventoryItem;
    const affected = items.filter(item => item[typeKey] === oldValue);

    // Update the list
    const updatedList = list.map(item => item === oldValue ? newValue.trim() : item);
    setList(updatedList);
    saveSettings({
      ...settings,
      [key]: updatedList
    });

    // Update any inventory items using this value
    if (affected.length > 0) {
      const updatedItems = items.map(item => {
        if (item[typeKey] === oldValue) {
          return { ...item, [typeKey]: newValue.trim() };
        }
        return item
      });
      saveItems(updatedItems);
      toast.success(`Updated ${affected.length} items with the new value`);
    } else {
      toast.success("Value updated successfully");
    }
  };

  const handleAddUser = (newUser: Omit<UserWithPassword, 'id'>) => {
    const userExists = users.some(u => u.username === newUser.username);
    if (userExists) {
      toast.error("Username already exists");
      return;
    }

    const user: User = {
      ...newUser,
      id: crypto.randomUUID()
    };

    saveUsers([...users, user]);
    toast.success("User added successfully");
  };

  const handleEditUser = (userId: string, updates: Partial<User>) => {
    // Only allow admins to change roles
    if (updates.role && user?.role !== 'admin') {
      toast.error("Only administrators can change user roles");
      return;
    }

    // Users can only edit their own profile unless they're an admin
    if (userId !== user?.id && user?.role !== 'admin') {
      toast.error("You can only edit your own profile");
      return;
    }

    // Don't allow users to change their own role
    if (userId === user?.id && updates.role && updates.role !== user.role) {
      toast.error("You cannot change your own role");
      return;
    }

    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, ...updates } : u
    );
    saveUsers(updatedUsers);
    toast.success("User profile updated");
  };

  const handleUpdateRole = (userId: string, newRole: 'admin' | 'user' | 'viewer') => {
    if (user?.role !== 'admin') {
      toast.error("Only administrators can change user roles");
      return;
    }

    if (userId === user?.id) {
      toast.error("You cannot change your own role");
      return;
    }

    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    );
    saveUsers(updatedUsers);
    toast.success("User role updated");
  };

  const handleRemoveUser = (userId: string) => {
    if (user?.role !== 'admin') {
      toast.error("Only administrators can remove users");
      return;
    }

    if (userId === user?.id) {
      toast.error("You cannot remove your own account");
      return;
    }
    
    const updatedUsers = users.filter(u => u.id !== userId);
    saveUsers(updatedUsers);
    toast.success("User removed");
  };

  const handleResetPassword = async (username: string, newPassword: string) => {
    try {
      await adminResetPassword(username, newPassword);
      toast.success("Password reset successfully");
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const renderUsersList = () => {
    if (!user) return null;

    return users.map(u => (
      <div
        key={u.id}
        className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => {
          // Only allow users to edit their own profile unless they're an admin
          if (u.id === user.id || user.role === 'admin') {
            setEditingUser(u);
          }
        }}
      >
        <div className="flex items-center space-x-4">
          <div>
            <p className="font-medium">{u.displayName}</p>
            <p className="text-sm text-muted-foreground">@{u.username}</p>
          </div>
          <Badge variant={u.role === 'admin' ? 'default' : u.role === 'user' ? 'secondary' : 'outline'}>
            {u.role}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {user.role === 'admin' && u.id !== user.id && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setResettingUser(u);
                }}
                title="Reset Password"
              >
                <Key className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveUser(u.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportConfiguration}>
            <Download className="mr-2 h-4 w-4" />
            Export Config
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-config')?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import Config
          </Button>
          <input
            id="import-config"
            type="file"
            accept=".json"
            className="hidden"
            onChange={importConfiguration}
          />
        </div>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Changes to categories, units, and other settings may affect existing inventory items.
          When removing a value that's in use, you'll be prompted to either remove it from items or replace it.
        </AlertDescription>
      </Alert>

      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lists">List Management</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

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
                  {Object.entries(listMap).map(([key, info]) => (
                    <TabsTrigger key={key} value={key}>
                      {info.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value="categories">
                  <Card>
                    <CardHeader>
                      <CardTitle>{listMap.categories.title}</CardTitle>
                      <CardDescription>{listMap.categories.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <EditableItemWithSubcategoriesList 
                        items={settings.categories}
                        setItems={(newItems) => {
                          const newItemsArray = Array.isArray(newItems) ? newItems : 
                            typeof newItems === 'function' ? (newItems as (prev: ItemWithSubcategories[]) => ItemWithSubcategories[])(settings.categories) : [];
                          updateSettingsList('categories', newItemsArray);
                        }}
                        title={listMap.categories.title}
                        description={listMap.categories.description}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {['units', 'locations', 'suppliers', 'projects'].map((key) => (
                  <TabsContent key={key} value={key}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{listMap[key as SettingsKey].title}</CardTitle>
                        <CardDescription>{listMap[key as SettingsKey].description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <EditableItemWithSubcategoriesList 
                          items={settings[key as keyof Omit<SettingsState, 'categories'>]}
                          setItems={(newItems) => {
                            const newItemsArray = Array.isArray(newItems) ? newItems : 
                              typeof newItems === 'function' ? (newItems as (prev: ItemWithSubcategories[]) => ItemWithSubcategories[])(settings[key as keyof Omit<SettingsState, 'categories'>]) : [];
                            updateSettingsList(key as SettingsKey, newItemsArray);
                          }}
                          title={listMap[key as SettingsKey].title}
                          description={listMap[key as SettingsKey].description}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
                <Button onClick={() => setShowAddUserDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {renderUsersList()}

                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found. Add some users to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddUserDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        onAdd={handleAddUser}
      />

      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
          onSave={handleEditUser}
        />
      )}

      {resettingUser && (
        <AdminResetPasswordDialog
          open={!!resettingUser}
          onOpenChange={(open) => !open && setResettingUser(null)}
          user={resettingUser}
          onReset={handleResetPassword}
        />
      )}

      {/* Reconciliation Dialog */}
      <Dialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
            <DialogDescription>
              The {itemToDelete?.type.toLowerCase().slice(0, -1)} "{itemToDelete?.value}" is used by {affectedItemsCount} inventory items.
              What would you like to do?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-2">
              <input
                type="radio"
                id="delete-option"
                name="reconcile-action"
                checked={reconcileAction === 'delete'}
                onChange={() => setReconcileAction('delete')}
                className="mt-1"
              />
              <div>
                <label htmlFor="delete-option" className="font-medium">Remove from items</label>
                <p className="text-sm text-muted-foreground">
                  Remove this {itemToDelete?.type.toLowerCase().slice(0, -1)} from all items that use it.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="radio"
                id="replace-option"
                name="reconcile-action"
                checked={reconcileAction === 'replace'}
                onChange={() => setReconcileAction('replace')}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="replace-option" className="font-medium">Replace with another value</label>
                <p className="text-sm text-muted-foreground mb-2">
                  Replace with another {itemToDelete?.type.toLowerCase().slice(0, -1)} in all affected items.
                </p>

                {reconcileAction === 'replace' && (
                  <select
                    className="w-full p-2 border rounded"
                    value={replacementValue}
                    onChange={(e) => setReplacementValue(e.target.value)}
                  >
                    <option value="">Select replacement...</option>
                    {itemToDelete && listMap[activeTab as keyof typeof listMap]?.list
                      .filter(item => item.name !== itemToDelete.value)
                      .map(item => (
                        <option key={item.id} value={item.name}>{item.name}</option>
                      ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReconcileDialog(false)}>Cancel</Button>
            <Button
              onClick={handleReconcileConfirm}
              disabled={reconcileAction === 'replace' && !replacementValue}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}