import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getItems, saveItems } from '@/lib/storageService'
import type { InventoryItem } from '@/types/inventory'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { logAction, getRecentLogs } from '@/lib/logging'
import { SettingsService } from '@/lib/settingsService'
import type { Cabinet } from '@/types/cabinets'
import { format } from 'date-fns'
import { DebugLogsButton } from '@/components/DebugLogsButton'
import { logger } from '@/utils/logger'

interface LogEntry {
  timestamp: string;
  action: string;
  details: Record<string, any>;
  status: 'success' | 'error';
}

export default function CheckoutPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [cabinets, setCabinets] = useState<Cabinet[]>([])
  const [recentActivities, setRecentActivities] = useState<LogEntry[]>([])
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    requireCheckoutForSecureCabinets: true
  })

  useEffect(() => {
    // Load items, cabinets, and settings on component mount
    const loadData = async () => {
      const inventoryItems = getItems()
      const loadedCabinets = await SettingsService.getCabinets()
      const loadedSettings = SettingsService.loadDefaultSettings()
      
      setItems(inventoryItems)
      setCabinets(loadedCabinets)
      setSettings(loadedSettings)
    }
    loadData()
  }, [])

  // Load recent activities
  useEffect(() => {
    const loadActivities = async () => {
      const logs = await getRecentLogs(10)
      const checkoutLogs = logs.filter(log => 
        log.action === 'ITEM_CHECKOUT' || log.action === 'ITEM_CHECKIN'
      )
      setRecentActivities(checkoutLogs)
    }
    loadActivities()
  }, [])

  const handleAction = async (action: 'check-in' | 'check-out') => {
    try {
      console.log(`[${action.toUpperCase()}] Starting ${action} action`, {
        itemId: selectedItemId,
        quantity,
        cabinetId: selectedCabinetId
      });

      if (!selectedItemId || !quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
        const error = 'Invalid item or quantity';
        console.log(`[ERROR] ${error}`, { selectedItemId, quantity });
        await logAction({
          action: 'VALIDATION_ERROR',
          details: {
            error,
            itemId: selectedItemId,
            quantity,
            cabinetId: selectedCabinetId
          },
          status: 'error'
        });
        toast.error('Please select an item and enter a valid quantity');
        return;
      }

      if (!selectedCabinetId) {
        const error = 'No cabinet selected';
        console.log(`[ERROR] ${error}`);
        await logAction({
          action: 'VALIDATION_ERROR',
          details: {
            error,
            itemId: selectedItemId,
            quantity,
            cabinetId: selectedCabinetId
          },
          status: 'error'
        });
        toast.error('Please select a cabinet');
        return;
      }

      const selectedCabinet = cabinets.find(c => c.id === selectedCabinetId);
      if (!selectedCabinet) {
        const error = 'Selected cabinet not found';
        console.log(`[ERROR] ${error}`, { cabinetId: selectedCabinetId });
        await logAction({
          action: 'CABINET_NOT_FOUND',
          details: {
            error,
            cabinetId: selectedCabinetId
          },
          status: 'error'
        });
        toast.error('Selected cabinet not found');
        return;
      }

      // Check if cabinet is secure and requires checkout
      if (settings.requireCheckoutForSecureCabinets && selectedCabinet.isSecure) {
        console.log('[INFO] Processing secure cabinet transaction', {
          cabinet: selectedCabinet.name,
          isSecure: selectedCabinet.isSecure
        });
      } else {
        const error = 'Cabinet does not require check-in/out';
        console.log(`[ERROR] ${error}`, { cabinet: selectedCabinet });
        await logAction({
          action: 'INVALID_CABINET_TYPE',
          details: {
            error,
            cabinetId: selectedCabinetId,
            cabinetName: selectedCabinet.name,
            isSecure: selectedCabinet.isSecure
          },
          status: 'error'
        });
        toast.error('This cabinet does not require check-in/out');
        return;
      }

      const numQuantity = Number(quantity)
      const selectedItem = items.find(item => item.id === selectedItemId)
      
      if (!selectedItem) {
        toast.error('Selected item not found')
        return
      }

      if (action === 'check-out' && (selectedItem.quantity || 0) < numQuantity) {
        toast.error('Not enough items available')
        return
      }

      const updatedItems = items.map(item => {
        if (item.id === selectedItemId) {
          const newQuantity = action === 'check-out' 
            ? Math.max(0, (item.quantity || 0) - numQuantity)
            : (item.quantity || 0) + numQuantity
          
          return {
            ...item,
            quantity: newQuantity,
            lastUpdated: new Date()
          }
        }
        return item
      })

      // Save the updated items to storage
      saveItems(updatedItems)
      setItems(updatedItems)
      
      // Log the activity
      await logAction({
        action: action === 'check-out' ? 'ITEM_CHECKOUT' : 'ITEM_CHECKIN',
        details: {
          itemId: selectedItemId,
          itemName: selectedItem?.name,
          quantity: numQuantity,
          cabinetId: selectedCabinetId,
          cabinetName: selectedCabinet.name,
          performedBy: user?.username
        },
        status: 'success'
      })
      
      toast.success(`Successfully ${action === 'check-out' ? 'checked out' : 'checked in'} ${numQuantity} ${selectedItem?.name}`)
      
      // Reset form
      setSelectedItemId('')
      setSelectedCabinetId('')
      setQuantity('')

      // Refresh activities
      const logs = await getRecentLogs(10)
      const checkoutLogs = logs.filter(log => 
        log.action === 'ITEM_CHECKOUT' || log.action === 'ITEM_CHECKIN'
      )
      setRecentActivities(checkoutLogs)
    } catch (error) {
      console.error('Error during check-in/out:', error)
      toast.error('Failed to process check-in/out')
    }
  }

  const secureCabinets = cabinets.filter(cabinet => cabinet.isSecure)

  // Add logging for selection changes
  const handleCabinetChange = async (cabinetId: string) => {
    console.log('[INFO] Cabinet selected', { cabinetId });
    await logAction({
      action: 'CABINET_SELECTED',
      details: {
        cabinetId,
        cabinetName: cabinets.find(c => c.id === cabinetId)?.name
      },
      status: 'success'
    });
    setSelectedCabinetId(cabinetId);
  };

  const handleItemChange = async (itemId: string) => {
    console.log('[INFO] Item selected', { itemId });
    await logAction({
      action: 'ITEM_SELECTED',
      details: {
        itemId,
        itemName: items.find(i => i.id === itemId)?.name
      },
      status: 'success'
    });
    setSelectedItemId(itemId);
  };

  const handleQuantityChange = async (value: string) => {
    console.log('[INFO] Quantity changed', { value });
    setQuantity(value);
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Secure Cabinet Check-In/Out</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Check In/Out Items</CardTitle>
            <CardDescription>
              Select a secure cabinet and item to check in or out.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Cabinet</label>
                <Select value={selectedCabinetId} onValueChange={handleCabinetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cabinet" />
                  </SelectTrigger>
                  <SelectContent>
                    {cabinets.map(cabinet => (
                      <SelectItem key={cabinet.id} value={cabinet.id}>
                        {cabinet.name} {cabinet.isSecure ? '(Secure)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Item</label>
                <Select value={selectedItemId} onValueChange={handleItemChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.quantity || 0} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 bg-gray-100 hover:bg-gray-200"
                  onClick={() => handleAction('check-in')}
                >
                  Check In
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-gray-100 hover:bg-gray-200"
                  onClick={() => handleAction('check-out')}
                >
                  Check Out
                </Button>
              </div>
            </div>
            <DebugLogsButton 
              onDownload={async () => {
                try {
                  // Log the action
                  await logAction({
                    action: 'DOWNLOAD_LOGS',
                    details: {
                      page: 'checkout',
                      timestamp: new Date().toISOString()
                    },
                    status: 'success'
                  });

                  // Use our logger to save the logs
                  await logger.downloadLogs('checkout');
                } catch (error) {
                  console.error('Error downloading logs:', error);
                  toast.error('Failed to download logs');
                }
              }}
              context="checkout"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Recent check-ins and check-outs from secure cabinets
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">
                        {activity.action === 'ITEM_CHECKOUT' ? 'Checked Out' : 'Checked In'}: {activity.details.quantity}x {activity.details.itemName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cabinet: {activity.details.cabinetName} | By: {activity.details.performedBy}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 