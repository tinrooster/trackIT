import { v4 as uuidv4 } from 'uuid';
import { InventoryItem, OrderStatus } from '@/types/inventory';
import { subDays, addDays } from 'date-fns';

const categories = ["Cable", "Connector", "Hardware", "Tool", "Software", "Expendable", "Fiber Optic", "Power", "Networking", "Audio", "Video", "Lighting"];
const units = ["ft", "each", "box", "spool", "kit", "license", "pair", "meter"];
const locations = ["Warehouse A", "Shelf B3", "Truck 1", "Server Room", "Edit Bay 2", "Studio C", "Tech Bench", "Remote Kit"];
const suppliers = ["Joseph Electronics", "Markertek", "B&H Photo", "Clark Wire & Cable", "Amazon Business", "Sweetwater", "Local Hardware"];
const projects = ["2025:SUTRO", "2024:NAB", "MAINTENANCE", "STUDIO_UPGRADE", "REMOTE_KIT_BUILD", "INFRASTRUCTURE"];
const orderStatuses: OrderStatus[] = ['delivered', 'partially_delivered', 'backordered', 'on_order', 'not_ordered'];

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

const dummyItems: InventoryItem[] = [];

for (let i = 0; i < 200; i++) {
  const category = categories[generateRandomInt(0, categories.length - 1)];
  const unit = units[generateRandomInt(0, units.length - 1)];
  const quantity = generateRandomInt(0, category === "Cable" ? 5000 : 100);
  const costPerUnit = category === "Cable" ? generateRandomFloat(0.10, 1.50) : generateRandomFloat(5, 500);
  const reorderLevel = generateRandomInt(0, quantity > 10 ? Math.floor(quantity * 0.3) : 5);
  const orderStatus = orderStatuses[generateRandomInt(0, orderStatuses.length - 1)];
  const deliveryPercentage = orderStatus === 'delivered' ? 100 : (orderStatus === 'partially_delivered' ? generateRandomInt(30, 90) : (orderStatus === 'on_order' ? generateRandomInt(0, 50) : 0));
  const lastUpdated = generateRandomDate(subDays(new Date(), 90), new Date());
  const expectedDeliveryDate = (orderStatus === 'backordered' || orderStatus === 'on_order') ? generateRandomDate(new Date(), addDays(new Date(), 30)) : undefined;

  dummyItems.push({
    id: uuidv4(),
    name: `${category} Item ${i + 1}`,
    description: `Generated dummy description for ${category} item #${i + 1}`,
    quantity: quantity,
    unit: unit,
    costPerUnit: Math.random() > 0.1 ? costPerUnit : undefined, // Some items without cost
    category: category,
    location: locations[generateRandomInt(0, locations.length - 1)],
    reorderLevel: Math.random() > 0.2 ? reorderLevel : undefined, // Some items without reorder level
    barcode: Math.random() > 0.3 ? generateBarcode() : undefined, // Some items without barcode
    notes: Math.random() > 0.7 ? `Additional notes for item ${i + 1}` : undefined,
    supplier: suppliers[generateRandomInt(0, suppliers.length - 1)],
    supplierWebsite: Math.random() > 0.6 ? `www.${suppliers[generateRandomInt(0, suppliers.length - 1)].toLowerCase().replace(/ /g, '')}.com` : undefined,
    project: Math.random() > 0.15 ? projects[generateRandomInt(0, projects.length - 1)] : undefined, // Some unassigned
    lastUpdated: lastUpdated,
    orderStatus: orderStatus,
    deliveryPercentage: deliveryPercentage,
    expectedDeliveryDate: expectedDeliveryDate,
  });
}

// Add a specific item like the example
dummyItems.push({
  id: uuidv4(),
  name: "Belden 1855a Yellow",
  description: "1000ft Spool, SDI Cable",
  quantity: 10, // 10 delivered
  unit: "spool",
  costPerUnit: 340,
  category: "Cable",
  location: "Warehouse A",
  reorderLevel: 5,
  barcode: generateBarcode(),
  notes: "14 ordered total, 4 backordered ETA 2 weeks",
  supplier: "Joseph Electronics",
  supplierWebsite: "www.josephelectronics.com",
  project: "2025:SUTRO",
  lastUpdated: new Date(),
  orderStatus: 'partially_delivered',
  deliveryPercentage: Math.round((10/14)*100), // ~71%
  expectedDeliveryDate: addDays(new Date(), 14)
});

export const DUMMY_INVENTORY_DATA = dummyItems;