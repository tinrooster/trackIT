"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LowStockItemsTable } from "@/components/LowStockItemsTable";
import { DashboardSummaryCard } from "@/components/DashboardSummaryCard";
import { InventoryItem } from "@/types/inventory";
import { Package, Tag, MapPin, AlertTriangle, ArrowRight, Plus } from "lucide-react";
import { QuickLookup } from "@/components/QuickLookup";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    // Load inventory data
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
      }
    };

    // Load recent activity
    const loadActivity = () => {
      try {
        const savedHistory = localStorage.getItem("inventory-history");
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          // Get the 5 most recent activities
          const recent = parsedHistory
            .sort((a: any, b: any) => {
              const dateA = new Date(a.timestamp);
              const dateB = new Date(b.timestamp);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);
          setRecentActivity(recent);
        }
      } catch (error) {
        console.error("Error loading activity data:", error);
      }
    };

    loadInventory();
    loadActivity();
    setIsLoading(false);
  }, []);

  const handleItemFound = (item: InventoryItem) => {
    navigate(`/inventory/${item.id}`);
  };

  const handleAddNewItem = () => {
    navigate("/inventory");
    // Set a flag in localStorage to open the add dialog
    localStorage.setItem("open-add-dialog", "true");
  };

  // Calculate summary statistics
  const totalItems = items.length;
  const uniqueCategories = new Set(items.map(item => item.category || "Uncategorized")).size;
  const uniqueLocations = new Set(items.map(item => item.location || "Unspecified")).size;
  const lowStockCount = items.filter(
    item => item.reorderLevel !== undefined && item.quantity < item.reorderLevel
  ).length;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <DashboardSummaryCard
          title="Total Items"
          value={totalItems}
          icon={Package}
          description="Items in inventory"
        />
        <DashboardSummaryCard
          title="Categories"
          value={uniqueCategories}
          icon={Tag}
          description="Unique categories"
        />
        <DashboardSummaryCard
          title="Locations"
          value={uniqueLocations}
          icon={MapPin}
          description="Storage locations"
        />
        <DashboardSummaryCard
          title="Low Stock Items"
          value={lowStockCount}
          icon={AlertTriangle}
          description="Items below reorder level"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription>
                  Items that need to be reordered soon
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/inventory")}
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <LowStockItemsTable items={items} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest inventory adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => {
                    const change = activity.newQuantity - activity.previousQuantity;
                    const changeText = change > 0 ? `+${change}` : change;
                    const changeClass = change > 0 ? "text-green-600" : "text-red-600";
                    
                    return (
                      <div 
                        key={index} 
                        className="flex justify-between items-center border-b pb-2 last:border-0"
                      >
                        <div>
                          <div className="font-medium">{activity.itemName}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {activity.reason}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={changeClass}>{changeText}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => navigate("/reports")}
                  >
                    View All Activity
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <QuickLookup items={items} onItemFound={handleItemFound} />
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common inventory tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => navigate("/inventory")}
              >
                <Package className="mr-2 h-4 w-4" />
                View Inventory
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleAddNewItem}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Item
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => navigate("/reports")}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                View Reports
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => navigate("/settings")}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Manage Settings
              </Button>
            </CardContent>
          </Card>
          
          {lowStockCount > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-800 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Attention Needed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-800 text-sm">
                  You have <strong>{lowStockCount}</strong> items below their reorder level.
                  Consider restocking soon.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => navigate("/inventory")}
                >
                  View Low Stock Items
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}