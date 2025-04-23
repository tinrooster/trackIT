import React, { useState, useEffect } from 'react'
    import { Save, GripVertical, AlertCircle } from 'lucide-react'
    import { Button } from '@/components/ui/button'
    import { Input } from '@/components/ui/input'
    import { toast } from 'sonner'
    import { getSettings, saveSettings, getInventoryItems, saveInventoryItems } from '@/lib/storageService' // Import saveInventoryItems
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
    import { Card, CardContent } from '@/components/ui/card'
    import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
    import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
    import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
    import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
    import { CSS } from '@dnd-kit/utilities'
    import { InventoryItem } from '@/types/inventory' // Import InventoryItem type

    // Sortable item component
    function SortableItem({ id, value, onRemove }: { id: string, value: string, onRemove: () => void }) {
      const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

      const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
      }

      return (
        <div ref={setNodeRef} style={style} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
          <div className="flex items-center">
            <button {...attributes} {...listeners} className="p-1 mr-2 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <span>{value}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      )
    }

    export default function SettingsPage() {
      const [categories, setCategories] = useState<string[]>([])
      const [units, setUnits] = useState<string[]>([])
      const [locations, setLocations] = useState<string[]>([])
      const [suppliers, setSuppliers] = useState<string[]>([])
      const [projects, setProjects] = useState<string[]>([])
      const [activeTab, setActiveTab] = useState("categories")
      const [showReconcileDialog, setShowReconcileDialog] = useState(false)
      const [itemToDelete, setItemToDelete] = useState<{type: string, value: string} | null>(null)
      const [affectedItemsCount, setAffectedItemsCount] = useState<number>(0) // Store count instead of full items
      const [reconcileAction, setReconcileAction] = useState<'delete' | 'replace'>('delete')
      const [replacementValue, setReplacementValue] = useState('')

      const listMap = {
        categories: { list: categories, setter: setCategories, title: 'Categories', key: 'category' },
        units: { list: units, setter: setUnits, title: 'Units', key: 'unit' },
        locations: { list: locations, setter: setLocations, title: 'Locations', key: 'location' },
        suppliers: { list: suppliers, setter: setSuppliers, title: 'Suppliers', key: 'supplier' },
        projects: { list: projects, setter: setProjects, title: 'Projects', key: 'project' }
      }

      // Load settings from localStorage
      useEffect(() => {
        const loadSettings = () => {
          setCategories(getSettings('CATEGORIES'))
          setUnits(getSettings('UNITS'))
          setLocations(getSettings('LOCATIONS'))
          setSuppliers(getSettings('SUPPLIERS'))
          setProjects(getSettings('PROJECTS'))
        }
        loadSettings()
      }, [])

      // Save settings to localStorage
      const saveAllSettings = () => {
        try {
          saveSettings('CATEGORIES', categories)
          saveSettings('UNITS', units)
          saveSettings('LOCATIONS', locations)
          saveSettings('SUPPLIERS', suppliers)
          saveSettings('PROJECTS', projects)
          toast.success("Settings saved successfully!")
        } catch (error) {
          console.error("Error saving settings:", error)
          toast.error("Failed to save settings")
        }
      }

      // Handle adding new items to lists
      const handleAddItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        if (value && !list.includes(value)) {
          setList([...list, value]) // Add to end
        }
      }

      // Handle removing items from lists - Check for usage
      const handleRemoveItemCheck = (typeTitle: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        const items = getInventoryItems()
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

      // Handle reconciliation confirmation
      const handleReconcileConfirm = () => {
        if (!itemToDelete) return

        const { type, value } = itemToDelete
        const { list, setter, key: typeKey } = listMap[activeTab as keyof typeof listMap]

        // 1. Update the settings list
        setter(list.filter(item => item !== value))

        // 2. Update affected inventory items
        const items = getInventoryItems()
        let updatedItems = items
        let toastMessage = "";

        if (reconcileAction === 'replace' && replacementValue) {
          updatedItems = items.map(item => {
            if (item[typeKey as keyof InventoryItem] === value) {
              // Create a new object to avoid modifying the original directly
              return { ...item, [typeKey]: replacementValue }
            }
            return item
          })
          toastMessage = `Updated ${affectedItemsCount} items: Replaced "${value}" with "${replacementValue}" in ${type.toLowerCase()}.`;
        } else { // 'delete' action
          updatedItems = items.map(item => {
            if (item[typeKey as keyof InventoryItem] === value) {
              // Create a new object and remove the property
              const newItem = { ...item }
              delete newItem[typeKey as keyof InventoryItem]
              return newItem
            }
            return item
          })
          toastMessage = `Removed "${value}" from ${affectedItemsCount} items.`;
        }

        saveInventoryItems(updatedItems) // Save the modified inventory items
        toast.success(toastMessage)

        // 3. Close dialog and reset state
        setShowReconcileDialog(false)
        setItemToDelete(null)
        setAffectedItemsCount(0)
        setReplacementValue('')
      }

      // Drag and Drop Sensors
      const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
      )

      // Handle Drag End for reordering
      const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        const { list, setter } = listMap[activeTab as keyof typeof listMap]

        if (over && active.id !== over.id) {
          const oldIndex = list.findIndex((item) => item === active.id)
          const newIndex = list.findIndex((item) => item === over.id)
          setter(arrayMove(list, oldIndex, newIndex))
        }
      }

      const renderSettingsList = (title: string, items: string[], setItems: React.Dispatch<React.SetStateAction<string[]>>, typeKey: string) => (
        <div className="space-y-2">
          <div className="flex">
            <Input
              type="text"
              className="flex-1 rounded-l-md"
              placeholder={`Add new ${title.toLowerCase().slice(0, -1)}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement
                  handleAddItem(items, setItems, input.value)
                  input.value = ''
                }
              }}
            />
            <Button
              className="rounded-l-none"
              onClick={() => {
                const input = document.querySelector(`input[placeholder="Add new ${title.toLowerCase().slice(0, -1)}"]`) as HTMLInputElement
                handleAddItem(items, setItems, input.value)
                input.value = ''
              }}
            >
              Add
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={items}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <SortableItem
                    key={item}
                    id={item}
                    value={item}
                    onRemove={() => handleRemoveItemCheck(title, items, setItems, item)} // Use check function
                  />
                ))}
              </SortableContext>
            </DndContext>
            {items.length === 0 && (
              <p className="text-gray-500">No {title.toLowerCase()} added yet</p>
            )}
          </div>
        </div>
      )

      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Settings</h1>
            <Button
              onClick={saveAllSettings}
              className="flex items-center"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Changes to categories, units, and other settings may affect existing inventory items.
              When removing a value that's in use, you'll be prompted to either remove it from items or replace it.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="categories" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="units">Units</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            <Card>
              <CardContent className="pt-6">
                <TabsContent value="categories">
                  <h2 className="text-xl font-semibold mb-4">Categories</h2>
                  {renderSettingsList("Categories", categories, setCategories, "category")}
                </TabsContent>

                <TabsContent value="units">
                  <h2 className="text-xl font-semibold mb-4">Units</h2>
                  {renderSettingsList("Units", units, setUnits, "unit")}
                </TabsContent>

                <TabsContent value="locations">
                  <h2 className="text-xl font-semibold mb-4">Locations</h2>
                  {renderSettingsList("Locations", locations, setLocations, "location")}
                </TabsContent>

                <TabsContent value="suppliers">
                  <h2 className="text-xl font-semibold mb-4">Suppliers</h2>
                  {renderSettingsList("Suppliers", suppliers, setSuppliers, "supplier")}
                </TabsContent>

                <TabsContent value="projects">
                  <h2 className="text-xl font-semibold mb-4">Projects</h2>
                  {renderSettingsList("Projects", projects, setProjects, "project")}
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>

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
                          .filter(item => item !== itemToDelete.value)
                          .map(item => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReconcileDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleReconcileConfirm} // Use the correct handler
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