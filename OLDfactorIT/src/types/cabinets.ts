import { z } from "zod";

export interface Cabinet {
  id: string;
  name: string;  // e.g., "A1", "B2", "E1"
  locationId: string;  // Reference to parent location
  description?: string;
  qrCode?: string;  // QR code identifier
  isSecure: boolean;  // Whether the cabinet requires check-out process
  allowedCategories?: string[];  // Categories of items allowed in this cabinet
}

export const cabinetSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Cabinet name is required"),
  locationId: z.string(),
  description: z.string().optional(),
  qrCode: z.string().optional(),
  isSecure: z.boolean().default(false),
  allowedCategories: z.array(z.string()).optional(),
});

export type CabinetWithItems = Cabinet & {
  items: {
    id: string;
    name: string;
    quantity: number;
  }[];
}; 