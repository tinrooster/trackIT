"use client";

import { useState, useEffect } from "react";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { CabinetManager } from "@/components/cabinets/CabinetManager";
import { ListManagement } from "@/components/settings/ListManagement";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("list-management");
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; subcategories?: any[] }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [items, setItems] = useState([]);

  // Load your data here
  useEffect(() => {
    // Add your data loading logic
    // Example:
    // const loadData = async () => {
    //   const loadedLocations = await fetchLocations();
    //   const loadedCategories = await fetchCategories();
    //   const loadedItems = await fetchItems();
    //   setLocations(loadedLocations);
    //   setCategories(loadedCategories);
    //   setItems(loadedItems);
    // };
    // loadData();
  }, []);

  const handleListUpdate = (type: string, items: any[]) => {
    switch (type) {
      case "locations":
        setLocations(items);
        break;
      case "categories":
        setCategories(items);
        break;
      case "units":
        setUnits(items);
        break;
      case "suppliers":
        setSuppliers(items);
        break;
      case "projects":
        setProjects(items);
        break;
    }
  };

  const handleExportConfig = () => {
    const config = {
      locations,
      categories,
      units,
      suppliers,
      projects,
      settings: {} // Add your settings here
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trackIT-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          if (config.locations) setLocations(config.locations);
          if (config.categories) setCategories(config.categories);
          if (config.units) setUnits(config.units);
          if (config.suppliers) setSuppliers(config.suppliers);
          if (config.projects) setProjects(config.projects);
          // Add your settings import logic here
        } catch (error) {
          console.error('Error importing config:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportConfig}>
            <Download className="w-4 h-4 mr-2" />
            Export Config
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Config
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-yellow-100/50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
            <span className="font-medium">Important</span>
          </div>
          <p className="text-sm text-yellow-800/90 dark:text-yellow-200/90">
            Changes to categories, units, and other settings may affect existing inventory items. 
            When removing a value that's in use, you'll be prompted to either remove it from items or replace it.
            Please export your configuration before making significant changes.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full border-b">
            <TabsTrigger value="list-management">List Management</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="test-tab">Test Tab</TabsTrigger>
          </TabsList>

          <TabsContent value="list-management">
            <ListManagement
              categories={categories}
              units={units}
              locations={locations}
              suppliers={suppliers}
              projects={projects}
              onUpdate={handleListUpdate}
            />
          </TabsContent>

          <TabsContent value="users">
            <div className="rounded-lg border p-4">
              <h2 className="text-xl font-semibold mb-4">User Management</h2>
              <p>User management content will go here.</p>
            </div>
          </TabsContent>

          <TabsContent value="test-tab">
            <div className="rounded-lg border p-4">
              <h2 className="text-xl font-semibold mb-4">Test Tab</h2>
              <p>This is a test tab to verify the tabs functionality is working correctly.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 