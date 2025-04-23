"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/InventoryTable";
import { AddItemDialog } from "@/components/AddItemDialog";
import { InventoryItem } from "@/types/inventory";
import { v4 as uuidv4 } from "uuid";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { QuickLookup } from "@/components/QuickLookup";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { TestComponent } from "@/components/TestComponent";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  
  // Settings for dropdowns
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);

  // Load inventory data from localStorage
  useEffect(() => {
    const loadInventory = () => {
      try {
        const savedItems = localStorage.getItem("inventory-data");
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems);
          // Convert string dates back to Date objects
          const processedItems = parsedItems.map((item: any) => ({
            ...item,
            lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
          }));
          setItems(processedItems);
        }
      } catch (error) {
        console.error("Error loading inventory data:", error);
        toast.error("Failed to load inventory data");
      }
    };

    const loadSettings = () => {
      try {
        const savedCategories = localStorage.getItem("inventory-categories");
        const savedUnits = localStorage.getItem("inventory-units");
        const savedLocations = localStorage.getItem("inventory-locations");
        const savedSuppliers = localStorage.getItem("inventory-suppliers");
        const savedProjects = localStorage.getItem("inventory-projects");
        
        setCategories(savedCategories ? JSON.parse(savedCategories) : []);
        setUnits(savedUnits ? JSON.parse(savedUnits) : []);
        setLocations(savedLocations ? JSON.parse(savedLocations) : []);
        setSuppliers(savedSuppliers ? JSON.parse(savedSuppliers) : []);
        setProjects(savedProjects ? JSON.parse(savedProjects) : []);
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadInventory();
    loadSettings();
  }, []);

  const handleAddItem = (newItemData: Omit<InventoryItem, "id" | "lastUpdated">) => {
    const newItem: InventoryItem = {
      ...newItemData,
      id: uuidv4(),
      lastUpdated: new Date(),
    };
    
    setItems(prevItems => [...prevItems, newItem]);
    setIsAddDialogOpen(false);
    setHighlightedItemId(newItem.id);
    toast.success(`Added ${newItem.name} to inventory`);
  };

  return (
    <div className="container mx-auto p-4">
      <TestComponent />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <div className="flex gap-2">
          <BarcodeScanner onScan={(barcode) => {
            const foundItem = items.find(item => item.barcode === barcode);
            if (foundItem) {
              setHighlightedItemId(foundItem.id);
              setFilter(barcode);
              toast.success(`Found: ${foundItem.name}`);
            } else {
              toast.error(`No item found with barcode: ${barcode}`);
            }
          }} />
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-3">
          <InventoryTable 
            items={items} 
            onEdit={(item) => {
              // Handle edit action
              console.log("Edit item:", item);
            }}
            initialFilter={filter}
            highlightRowId={highlightedItemId}
          />
        </div>
        <div className="md:col-span-1">
          <QuickLookup 
            items={items} 
            onItemFound={(item) => {
              setHighlightedItemId(item.id);
              setFilter(item.name);
            }} 
          />
        </div>
      </div>
      
      <AddItemDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddItem={handleAddItem}
        categories={categories}
        units={units}
        locations={locations}
        suppliers={suppliers}
        projects={projects}
      />
    </div>
  );
}