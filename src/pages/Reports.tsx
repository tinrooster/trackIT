"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryHistory } from "@/components/InventoryHistory";
import { InventoryItem } from "@/types/inventory";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface InventoryHistoryEntry {
  itemId: string;
  itemName: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: Date | string;
}

export default function ReportsPage() {
  const [history, setHistory] = useState<InventoryHistoryEntry[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    // Load inventory history
    const loadHistory = () => {
      try {
        const savedHistory = localStorage.getItem("inventory-history");
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          setHistory(parsedHistory);
        }
      } catch (error) {
        console.error("Error loading inventory history:", error);
      }
    };

    // Load inventory items
    const loadItems = () => {
      try {
        const savedItems = localStorage.getItem("inventory-data");
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems);
          setItems(parsedItems);
        }
      } catch (error) {
        console.error("Error loading inventory data:", error);
      }
    };

    loadHistory();
    loadItems();
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Reports & Analytics</h1>
      
      <Tabs defaultValue="history" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="history">Inventory History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory History</CardTitle>
              <CardDescription>
                Track all changes made to your inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No inventory history available yet.</p>
                  <p className="text-sm mt-2">
                    History will be recorded when you make changes to inventory quantities.
                  </p>
                </div>
              ) : (
                <InventoryHistory history={history} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Inventory Summary</CardTitle>
              <CardDescription>
                Key metrics about your inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Total Items</div>
                  <div className="text-2xl font-bold">{items.length}</div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Categories</div>
                  <div className="text-2xl font-bold">
                    {new Set(items.map(item => item.category || "Uncategorized")).size}
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Low Stock Items</div>
                  <div className="text-2xl font-bold">
                    {items.filter(item => 
                      item.reorderLevel !== undefined && 
                      item.quantity < item.reorderLevel
                    ).length}
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Recent Changes</div>
                  <div className="text-2xl font-bold">
                    {history.filter(entry => {
                      const entryDate = new Date(entry.timestamp);
                      const now = new Date();
                      const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
                      return daysDiff <= 7;
                    }).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}