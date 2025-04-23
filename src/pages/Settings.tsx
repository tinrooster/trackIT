"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Save, FileUp, FileDown } from "lucide-react";
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from "uuid";

// Schema for the settings form
const settingsFormSchema = z.object({
  defaultCategory: z.string().optional(),
  defaultUnit: z.string().optional(),
  defaultLocation: z.string().optional(),
  defaultSupplier: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  
  // Settings lists
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  
  // New item inputs
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [newProject, setNewProject] = useState("");
  
  // General settings form
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      defaultCategory: "",
      defaultUnit: "",
      defaultLocation: "",
      defaultSupplier: "",
    },
  });

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      try {
        // Load lists
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
        
        // Load general settings
        const savedGeneralSettings = localStorage.getItem("inventory-general-settings");
        if (savedGeneralSettings) {
          const parsedSettings = JSON.parse(savedGeneralSettings);
          form.reset(parsedSettings);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      }
    };
    
    loadSettings();
  }, [form]);

  // Save general settings
  const onSubmit = (values: SettingsFormValues) => {
    try {
      localStorage.setItem("inventory-general-settings", JSON.stringify(values));
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  // Add new item to a list
  const addItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, newItem: string, storageKey: string, setNewItem: React.Dispatch<React.SetStateAction<string>>) => {
    if (!newItem.trim()) {
      toast.warning("Please enter a name");
      return;
    }
    
    if (list.includes(newItem.trim())) {
      toast.warning(`"${newItem}" already exists`);
      return;
    }
    
    const updatedList = [...list, newItem.trim()].sort();
    setList(updatedList);
    localStorage.setItem(storageKey, JSON.stringify(updatedList));
    setNewItem("");
    toast.success(`Added "${newItem}"`);
  };

  // Remove item from a list
  const removeItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string, storageKey: string) => {
    const updatedList = list.filter(i => i !== item);
    setList(updatedList);
    localStorage.setItem(storageKey, JSON.stringify(updatedList));
    toast.success(`Removed "${item}"`);
  };

  // Export all data
  const handleExportAllData = () => {
    try {
      // Get inventory data
      const inventoryData = JSON.parse(localStorage.getItem("inventory-data") || "[]");
      const historyData = JSON.parse(localStorage.getItem("inventory-history") || "[]");
      
      // Create a workbook with multiple sheets
      const workbook = XLSX.utils.book_new();
      
      // Add inventory data sheet
      const inventoryWorksheet = XLSX.utils.json_to_sheet(inventoryData);
      XLSX.utils.book_append_sheet(workbook, inventoryWorksheet, "Inventory");
      
      // Add history data sheet
      const historyWorksheet = XLSX.utils.json_to_sheet(historyData);
      XLSX.utils.book_append_sheet(workbook, historyWorksheet, "History");
      
      // Add settings sheets
      const categoriesWorksheet = XLSX.utils.json_to_sheet(
        categories.map(cat => ({ category: cat }))
      );
      XLSX.utils.book_append_sheet(workbook, categoriesWorksheet, "Categories");
      
      const unitsWorksheet = XLSX.utils.json_to_sheet(
        units.map(unit => ({ unit }))
      );
      XLSX.utils.book_append_sheet(workbook, unitsWorksheet, "Units");
      
      const locationsWorksheet = XLSX.utils.json_to_sheet(
        locations.map(loc => ({ location: loc }))
      );
      XLSX.utils.book_append_sheet(workbook, locationsWorksheet, "Locations");
      
      const suppliersWorksheet = XLSX.utils.json_to_sheet(
        suppliers.map(sup => ({ supplier: sup }))
      );
      XLSX.utils.book_append_sheet(workbook, suppliersWorksheet, "Suppliers");
      
      const projectsWorksheet = XLSX.utils.json_to_sheet(
        projects.map(proj => ({ project: proj }))
      );
      XLSX.utils.book_append_sheet(workbook, projectsWorksheet, "Projects");
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, "Inventory_System_Backup.xlsx");
      
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  // Import data from Excel file
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            toast.error("Failed to read file");
            return;
          }
          
          // Parse the Excel file
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Process inventory data
          if (workbook.SheetNames.includes("Inventory")) {
            const inventorySheet = workbook.Sheets["Inventory"];
            const inventoryData = XLSX.utils.sheet_to_json(inventorySheet);
            
            // Process and validate inventory data
            const processedInventory = inventoryData.map((item: any) => {
              // Ensure each item has an ID
              if (!item.id) {
                item.id = uuidv4();
              }
              
              // Convert lastUpdated string to Date
              if (item.lastUpdated) {
                item.lastUpdated = new Date(item.lastUpdated);
              } else {
                item.lastUpdated = new Date();
              }
              
              return item;
            });
            
            localStorage.setItem("inventory-data", JSON.stringify(processedInventory));
          }
          
          // Process history data
          if (workbook.SheetNames.includes("History")) {
            const historySheet = workbook.Sheets["History"];
            const historyData = XLSX.utils.sheet_to_json(historySheet);
            localStorage.setItem("inventory-history", JSON.stringify(historyData));
          }
          
          // Process settings data
          if (workbook.SheetNames.includes("Categories")) {
            const categoriesSheet = workbook.Sheets["Categories"];
            const categoriesData = XLSX.utils.sheet_to_json(categoriesSheet);
            const categories = categoriesData.map((item: any) => item.category).filter(Boolean);
            setCategories(categories);
            localStorage.setItem("inventory-categories", JSON.stringify(categories));
          }
          
          if (workbook.SheetNames.includes("Units")) {
            const unitsSheet = workbook.Sheets["Units"];
            const unitsData = XLSX.utils.sheet_to_json(unitsSheet);
            const units = unitsData.map((item: any) => item.unit).filter(Boolean);
            setUnits(units);
            localStorage.setItem("inventory-units", JSON.stringify(units));
          }
          
          if (workbook.SheetNames.includes("Locations")) {
            const locationsSheet = workbook.Sheets["Locations"];
            const locationsData = XLSX.utils.sheet_to_json(locationsSheet);
            const locations = locationsData.map((item: any) => item.location).filter(Boolean);
            setLocations(locations);
            localStorage.setItem("inventory-locations", JSON.stringify(locations));
          }
          
          if (workbook.SheetNames.includes("Suppliers")) {
            const suppliersSheet = workbook.Sheets["Suppliers"];
            const suppliersData = XLSX.utils.sheet_to_json(suppliersSheet);
            const suppliers = suppliersData.map((item: any) => item.supplier).filter(Boolean);
            setSuppliers(suppliers);
            localStorage.setItem("inventory-suppliers", JSON.stringify(suppliers));
          }
          
          if (workbook.SheetNames.includes("Projects")) {
            const projectsSheet = workbook.Sheets["Projects"];
            const projectsData = XLSX.utils.sheet_to_json(projectsSheet);
            const projects = projectsData.map((item: any) => item.project).filter(Boolean);
            setProjects(projects);
            localStorage.setItem("inventory-projects", JSON.stringify(projects));
          }
          
          toast.success("Data imported successfully");
        } catch (error) {
          console.error("Error processing import file:", error);
          toast.error("Failed to process import file");
        }
      };
      
      reader.onerror = () => {
        toast.error("Failed to read file");
      };
      
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error importing data:", error);
      toast.error("Failed to import data");
    }
    
    // Clear the file input
    event.target.value = "";
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure default values for new inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="defaultCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Electronics" {...field} />
                        </FormControl>
                        <FormDescription>
                          This category will be pre-selected when adding new items
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="defaultUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., pcs" {...field} />
                        </FormControl>
                        <FormDescription>
                          This unit will be pre-selected when adding new items
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="defaultLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Warehouse A" {...field} />
                        </FormControl>
                        <FormDescription>
                          This location will be pre-selected when adding new items
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="defaultSupplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Supplier</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Acme Inc." {...field} />
                        </FormControl>
                        <FormDescription>
                          This supplier will be pre-selected when adding new items
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Manage categories for organizing inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="New category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem(categories, setCategories, newCategory, "inventory-categories", setNewCategory)}
                />
                <Button onClick={() => addItem(categories, setCategories, newCategory, "inventory-categories", setNewCategory)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        No categories defined yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category}>
                        <TableCell>{category}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(categories, setCategories, category, "inventory-categories")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="units">
          <Card>
            <CardHeader>
              <CardTitle>Units</CardTitle>
              <CardDescription>
                Manage units of measurement for inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="New unit name"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem(units, setUnits, newUnit, "inventory-units", setNewUnit)}
                />
                <Button onClick={() => addItem(units, setUnits, newUnit, "inventory-units", setNewUnit)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit Name</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        No units defined yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    units.map((unit) => (
                      <TableRow key={unit}>
                        <TableCell>{unit}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(units, setUnits, unit, "inventory-units")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Locations</CardTitle>
              <CardDescription>
                Manage storage locations for inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="New location name"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem(locations, setLocations, newLocation, "inventory-locations", setNewLocation)}
                />
                <Button onClick={() => addItem(locations, setLocations, newLocation, "inventory-locations", setNewLocation)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        No locations defined yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((location) => (
                      <TableRow key={location}>
                        <TableCell>{location}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(locations, setLocations, location, "inventory-locations")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>
                Manage suppliers for inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="New supplier name"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem(suppliers, setSuppliers, newSupplier, "inventory-suppliers", setNewSupplier)}
                />
                <Button onClick={() => addItem(suppliers, setSuppliers, newSupplier, "inventory-suppliers", setNewSupplier)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        No suppliers defined yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((supplier) => (
                      <TableRow key={supplier}>
                        <TableCell>{supplier}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(suppliers, setSuppliers, supplier, "inventory-suppliers")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                Manage projects for inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="New project name"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem(projects, setProjects, newProject, "inventory-projects", setNewProject)}
                />
                <Button onClick={() => addItem(projects, setProjects, newProject, "inventory-projects", setNewProject)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        No projects defined yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    projects.map((project) => (
                      <TableRow key={project}>
                        <TableCell>{project}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(projects, setProjects, project, "inventory-projects")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export and import inventory data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Export Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Export all inventory data, history, and settings to an Excel file for backup or transfer.
                </p>
                <Button onClick={handleExportAllData}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export All Data
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-2">Import Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import inventory data, history, and settings from a previously exported Excel file.
                  <br />
                  <span className="text-destructive">Warning: This will overwrite your current data.</span>
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".xlsx"
                    onChange={handleImportData}
                    className="max-w-sm"
                  />
                  <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-2">Reset Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Clear all inventory data and settings. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}