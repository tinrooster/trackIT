import { InventoryItem } from "./inventory";

export interface ItemTemplate extends Omit<InventoryItem, 'id' | 'lastUpdated'> {
  templateId: string;
  templateName: string;
  description: string;
  category: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
} 