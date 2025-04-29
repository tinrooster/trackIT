/**
 * DEPRECATED: This file contains dummy data that was previously used for initializing
 * the application. It is now kept for reference only and is no longer used.
 * 
 * For new installations, use the export/import functionality to seed data from
 * existing exports.
 */

import { v4 as uuidv4 } from 'uuid';
import { InventoryItem, OrderStatus } from '@/types/inventory';
import { subDays, addDays } from 'date-fns';
import { STORAGE_KEYS } from "./storageService";

const categories = ["Cable", "Connector", "Hardware", "Tool", "Software", "Expendable", "Fiber Optic", "Power", "Networking", "Audio", "Video", "Lighting"];
const units = ["ft", "each", "box", "spool", "kit", "license", "pair", "meter"];
const locationNames = ["Rm 105 A", "Engineering Store", "PCR 1 Project Area", "TE Room", "Lighting Rm", "Studio ", "Tech Bench", "Remote Kit"];
const locations = locationNames.map(name => ({
  id: uuidv4(),
  name,
  subcategories: []
}));
const suppliers = ["Joseph Electronics", "Markertek", "B&H Photo", "Clark Wire & Cable", "Amazon Business", "Sweetwater", "Local Hardware"];
const projects = ["2025:SUTRO", "2024:NAB", "MAINTENANCE", "STUDIO_UPGRADE", "Ultrix", "INFRASTRUCTURE"];

const generateRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const generateRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomFloat = (min: number, max: number, decimals: number = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
};

const generateBarcode = (): string => {
  return Math.random().toString(36).substring(2, 15).toUpperCase();
}

function generateRandomOrderStatus(): OrderStatus {
  const statuses = [
    OrderStatus.PENDING,
    OrderStatus.IN_PROGRESS,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED
  ];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

const dummyItems: InventoryItem[] = [];

for (let i = 0; i < 200; i++) {
  const category = categories[generateRandomInt(0, categories.length - 1)];
  const unit = units[generateRandomInt(0, units.length - 1)];
  const location = locations[generateRandomInt(0, locations.length - 1)];
  const quantity = generateRandomInt(0, category === "Cable" ? 5000 : 100);
  const costPerUnit = category === "Cable" ? generateRandomFloat(0.10, 1.50) : generateRandomFloat(5, 500);
  const price = costPerUnit * 1.3; // 30% markup
  const reorderLevel = generateRandomInt(0, quantity > 10 ? Math.floor(quantity * 0.3) : 5);
  const minQuantity = reorderLevel;
  const orderStatus = generateRandomOrderStatus();
  const deliveryPercentage = orderStatus === OrderStatus.COMPLETED ? 100 : (orderStatus === OrderStatus.IN_PROGRESS ? generateRandomInt(30, 90) : 0);
  const lastUpdated = generateRandomDate(new Date(2023, 0, 1), new Date());
  const lastOrdered = orderStatus === OrderStatus.COMPLETED ? new Date() : undefined;
  const expectedDelivery = orderStatus === OrderStatus.IN_PROGRESS ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined;

  dummyItems.push({
    id: uuidv4(),
    name: `${category} Item ${i + 1}`,
    description: `Generated dummy description for ${category} item #${i + 1}`,
    quantity: quantity,
    minQuantity: minQuantity,
    unit: unit,
    costPerUnit: Math.random() > 0.1 ? costPerUnit : undefined, // Some items without cost
    price: Math.random() > 0.1 ? price : undefined, // Some items without price
    category: category,
    location: location.id,
    reorderLevel: Math.random() > 0.2 ? reorderLevel : undefined, // Some items without reorder level
    barcode: Math.random() > 0.3 ? generateBarcode() : undefined, // Some items without barcode
    notes: Math.random() > 0.7 ? `Additional notes for item ${i + 1}` : undefined,
    supplier: suppliers[generateRandomInt(0, suppliers.length - 1)],
    supplierWebsite: Math.random() > 0.6 ? `www.${suppliers[generateRandomInt(0, suppliers.length - 1)].toLowerCase().replace(/ /g, '')}.com` : undefined,
    project: Math.random() > 0.15 ? projects[generateRandomInt(0, projects.length - 1)] : undefined, // Some unassigned
    lastUpdated: lastUpdated,
    orderStatus: orderStatus,
    deliveryPercentage: deliveryPercentage,
    expectedDeliveryDate: expectedDelivery,
  });
}

// Update the specific example item
const warehouseLocation = {
  id: uuidv4(),
  name: "Warehouse A",
  subcategories: []
};
locations.push(warehouseLocation);

dummyItems.push({
  id: uuidv4(),
  name: "Belden 1855a Yellow",
  description: "1000ft Spool, SDI Cable",
  quantity: 10, // 10 delivered
  minQuantity: 5,
  unit: "spool",
  costPerUnit: 340,
  price: 442, // ~30% markup
  category: "Cable",
  location: warehouseLocation.id,
  reorderLevel: 5,
  barcode: generateBarcode(),
  notes: "DUMMY DATA   >  14 ordered total, 4 backordered ETA 2 weeks",
  supplier: "Joseph Electronics",
  supplierWebsite: "www.josephelectronics.com",
  project: "2025:SUTRO",
  lastUpdated: new Date(),
  orderStatus: OrderStatus.IN_PROGRESS,
  deliveryPercentage: Math.round((10/14)*100), // ~71%
  expectedDeliveryDate: addDays(new Date(), 14)
});

// Initial settings data
export const INITIAL_SETTINGS = {
  [STORAGE_KEYS.CATEGORIES]: categories,
  [STORAGE_KEYS.UNITS]: units,
  [STORAGE_KEYS.LOCATIONS]: locations,
  [STORAGE_KEYS.SUPPLIERS]: suppliers,
  [STORAGE_KEYS.PROJECTS]: projects
};

// Function to initialize settings if they don't exist
export const initializeSettings = () => {
  Object.entries(INITIAL_SETTINGS).forEach(([key, values]) => {
    const existing = localStorage.getItem(key);
    if (!existing) {
      localStorage.setItem(key, JSON.stringify(values));
    }
  });
};

export const DUMMY_INVENTORY_DATA = dummyItems;