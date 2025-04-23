"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ItemDetails } from "@/components/ItemDetails";
import { EditItemDialog } from "@/components/EditItemDialog";
import { InventoryItem } from "@/types/inventory";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Settings for dropdowns
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    // Load settings
    const loadedCategories = JSON.parse(localStorage.getItem("inventory-categories") || "[]");
    const loadedUnits = JSON.parse(localStorage.getItem("inventory-units") || "[]");
    const loadedLocations = JSON.parse(localStorage.getItem("inventory-locations") || "[]");
    const loadedSuppliers = JSON.parse(localStorage.getItem("inventory-suppliers") || "[]");
    const loadedProjects = JSON.parse(localStorage.getItem("inventory-projects") || "[]");
    
    setCategories(loadedCategories);
    setUnits(loadedUnits);
    setLocations(loadedLocations);
    setSuppliers(loadedSuppliers);
    setProjects(loadedProjects);
    
    // Load item data
    if (itemId) {
      const inventoryData = JSON.parse(localStorage.getItem("inventory-data") || "[]");
      const foundItem = inventoryData.find((i: InventoryItem) => i.id === itemId);
      
      if (foundItem) {
        // Convert lastUpdated string back to Date object
        if (foundItem.lastUpdated) {
          foundItem.lastUpdated = new Date(foundItem.lastUpdated);
        }
        
        setItem(foundItem);
      } else {
        toast.error("Item not found");
        navigate("/inventory");
      }
    }
    
    setIsLoading(false);
  }, [itemId, navigate]);

  const handleEdit = (itemToEdit: InventoryItem) => {
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedItemData: any) => {
    if (!item) return;
    
    const inventoryData = JSON.parse(localStorage.getItem("inventory-data") || "[]");
    const updatedInventory = inventoryData.map((i: InventoryItem) => 
      i.id === item.id ? { ...i, ...updatedItemData, lastUpdated: new Date() } : i
    );
    
    localStorage.setItem("inventory-data", JSON.stringify(updatedInventory));
    
    // Update local state
    const updatedItem = { ...item, ...updatedItemData, lastUpdated: new Date() };
    setItem(updatedItem);
    
    setIsEditDialogOpen(false);
    toast.success("Item updated successfully");
  };

  const handleDelete = (itemId: string) => {
    const inventoryData = JSON.parse(localStorage.getItem("inventory-data") || "[]");
    const updatedInventory = inventoryData.filter((i: InventoryItem) => i.id !== itemId);
    
    localStorage.setItem("inventory-data", JSON.stringify(updatedInventory));
    
    navigate("/inventory");
    toast.success("Item deleted successfully");
  };

  const handleAdjust = (itemId: string, newQuantity: number, reason: string) => {
    if (!item) return;
    
    const inventoryData = JSON.parse(localStorage.getItem("inventory-data") || "[]");
    const updatedInventory = inventoryData.map((i: InventoryItem) => 
      i.id === itemId ? { ...i, quantity: newQuantity, lastUpdated: new Date() } : i
    );
    
    localStorage.setItem("inventory-data", JSON.stringify(updatedInventory));
    
    // Update local state
    const updatedItem = { ...item, quantity: newQuantity, lastUpdated: new Date() };
    setItem(updatedItem);
    
    // Log this adjustment to a separate "history" storage
    const adjustmentHistory = JSON.parse(localStorage.getItem("inventory-history") || "[]");
    adjustmentHistory.push({
      itemId,
      itemName: item.name,
      previousQuantity: item.quantity,
      newQuantity,
      reason,
      timestamp: new Date(),
    });
    localStorage.setItem("inventory-history", JSON.stringify(adjustmentHistory));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Item Not Found</h2>
          <p className="mb-4">The requested item could not be found.</p>
          <Button onClick={() => navigate("/inventory")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate("/inventory")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Item Details</h1>
      
      <ItemDetails 
        item={item} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        onAdjust={handleAdjust}
      />
      
      <EditItemDialog
        item={item}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSaveEdit}
        categories={categories}
        units={units}
        locations={locations}
        suppliers={suppliers}
      />
    </div>
  );
}