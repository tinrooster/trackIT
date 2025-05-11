// Common types used across the application
export interface Location {
  id: string;
  name: string;
  type: 'Area' | 'Rack' | 'Cabinet';
  parentId?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  status: string;
  locationId: string;
  projectId?: string;
  assignedToId?: string;
}

export interface Settings {
  locations: Location[];
}

export class StorageError extends Error {
  code?: string;
  details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

// Request/Response types for Tauri commands
export interface LocationData {
  name: string;
  type_: string;
  parent_id?: string;
}

export interface ProjectData {
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
} 