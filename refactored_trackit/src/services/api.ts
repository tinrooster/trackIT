import { z } from 'zod';
import type {
  User,
  Asset,
  Location,
  Transaction,
  MaintenanceLog,
  Consumable,
} from '../types/entities';

// API Response types
const ApiResponse = z.object({
  success: z.boolean(),
  data: z.unknown(),
  error: z.string().optional(),
});

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Asset API
export const assetApi = {
  getAll: () => apiRequest<Asset[]>('/assets'),
  getById: (id: string) => apiRequest<Asset>(`/assets/${id}`),
  create: (asset: Omit<Asset, 'id'>) =>
    apiRequest<Asset>('/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    }),
  update: (id: string, asset: Partial<Asset>) =>
    apiRequest<Asset>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(asset),
    }),
  delete: (id: string) =>
    apiRequest(`/assets/${id}`, {
      method: 'DELETE',
    }),
  search: (query: string) =>
    apiRequest<Asset[]>(`/assets/search?q=${encodeURIComponent(query)}`),
};

// Transaction API
export const transactionApi = {
  getAll: () => apiRequest<Transaction[]>('/transactions'),
  checkOut: (assetId: string, userId: string, dueDate?: Date) =>
    apiRequest<Transaction>('/transactions/checkout', {
      method: 'POST',
      body: JSON.stringify({ assetId, userId, dueDate }),
    }),
  checkIn: (assetId: string, userId: string) =>
    apiRequest<Transaction>('/transactions/checkin', {
      method: 'POST',
      body: JSON.stringify({ assetId, userId }),
    }),
  getByAsset: (assetId: string) =>
    apiRequest<Transaction[]>(`/transactions/asset/${assetId}`),
  getByUser: (userId: string) =>
    apiRequest<Transaction[]>(`/transactions/user/${userId}`),
};

// User API
export const userApi = {
  getAll: () => apiRequest<User[]>('/users'),
  getById: (id: string) => apiRequest<User>(`/users/${id}`),
  create: (user: Omit<User, 'id'>) =>
    apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  update: (id: string, user: Partial<User>) =>
    apiRequest<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    }),
  delete: (id: string) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// Location API
export const locationApi = {
  getAll: () => apiRequest<Location[]>('/locations'),
  getById: (id: string) => apiRequest<Location>(`/locations/${id}`),
  create: (location: Omit<Location, 'id'>) =>
    apiRequest<Location>('/locations', {
      method: 'POST',
      body: JSON.stringify(location),
    }),
  update: (id: string, location: Partial<Location>) =>
    apiRequest<Location>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(location),
    }),
  delete: (id: string) =>
    apiRequest(`/locations/${id}`, {
      method: 'DELETE',
    }),
};

// Maintenance API
export const maintenanceApi = {
  getAll: () => apiRequest<MaintenanceLog[]>('/maintenance'),
  getByAsset: (assetId: string) =>
    apiRequest<MaintenanceLog[]>(`/maintenance/asset/${assetId}`),
  create: (log: Omit<MaintenanceLog, 'id'>) =>
    apiRequest<MaintenanceLog>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(log),
    }),
  update: (id: string, log: Partial<MaintenanceLog>) =>
    apiRequest<MaintenanceLog>(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(log),
    }),
};

// Consumables API
export const consumableApi = {
  getAll: () => apiRequest<Consumable[]>('/consumables'),
  getById: (id: string) => apiRequest<Consumable>(`/consumables/${id}`),
  create: (consumable: Omit<Consumable, 'id'>) =>
    apiRequest<Consumable>('/consumables', {
      method: 'POST',
      body: JSON.stringify(consumable),
    }),
  update: (id: string, consumable: Partial<Consumable>) =>
    apiRequest<Consumable>(`/consumables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(consumable),
    }),
  updateQuantity: (id: string, quantity: number) =>
    apiRequest<Consumable>(`/consumables/${id}/quantity`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
}; 