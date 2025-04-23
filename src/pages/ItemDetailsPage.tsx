import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ItemDetails } from '@/components/ItemDetails';
import { InventoryHistory } from '@/components/InventoryHistory';
import { InventoryItem, InventoryHistoryEntry } from '@/types/inventory';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

export default function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [items, setItems] = useLocalStorage<InventoryItem[]>('inventoryItems', []);
  const [history, setHistory] = useLocalStorage<InventoryHistoryEntry[]>('inventoryHistory', []);
  const [activeTab, setActiveTab] = useState('details');
  
  const item = items.find(item => item.id === id);
  
  // Filter history for this item
  const itemHistory = history.filter(entry => entry.itemId === id);
  
  // Redirect if item not found
  useEffect(() => {
    if (!item && items.length > 0) {
      toast.error("Item not found");
      navigate('/inventory');
    }
  }, [item, items, navigate]);
  
  if (!item) {
    return <div>Loading...</div>;
  }
  
  const handleEditItem = (updatedItem: InventoryItem) => {
    const updatedItems = items.map(i => 
      i.id === updatedItem.id 
        ? { ...updatedItem, lastUpdated: new Date(), lastModifiedBy: user?.id } 
        : i
    );
    setItems(updatedItems);
    toast.success(`Updated "${updatedItem.name}"`);
  };
  
  const handleDeleteItem = (itemId: string) => {
    const updatedItems = items.filter(i => i.id !== itemId);
    setItems(updatedItems);
    toast.success("Item deleted successfully");
    navigate('/inventory');
  };
  
  const handleAdjustQuantity = (itemId: string, newQuantity: number, reason: string) => {
    const itemToUpdate = items.find(i => i.id === itemId);
    
    if (!itemToUpdate) return;
    
    const previousQuantity = itemToUpdate.quantity;
    
    // Update the item
    const updatedItems = items.map(i => 
      i.id === itemId 
        ? { ...i, quantity: newQuantity, lastUpdated: new Date(), lastModifiedBy: user?.id } 
        : i
    );
    
    // Add to history
    const historyEntry: InventoryHistoryEntry = {
      id: uuidv4(),
      itemId,
      itemName: itemToUpdate.name,
      previousQuantity,
      newQuantity,
      reason,
      timestamp: new Date(),
      userId: user?.id,
      userName: user?.username
    };
    
    setItems(updatedItems);
    setHistory([...history, historyEntry]);
    
    // No toast here as the InventoryAdjustment component already shows one
  };
  
  return (
    <div className="space-y-6">
      <div>
        <button 
          onClick={() => navigate('/inventory')}
          className="text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          ← Back to Inventory
        </button>
        <h1 className="text-2xl font-bold">{item.name}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Item Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6 pt-4">
          <ItemDetails 
            item={item} 
            onEdit={handleEditItem} 
            onDelete={handleDeleteItem} 
            onAdjust={handleAdjustQuantity} 
          />
          
          {/* User tracking information */}
          <div className="border rounded-lg p-4 bg-muted/20">
            <h3 className="text-lg font-medium mb-4">Tracking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created by:</p>
                <p className="font-medium">{item.createdBy || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last modified by:</p>
                <p className="font-medium">{item.lastModifiedBy || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="pt-4">
          <InventoryHistory history={itemHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}