export interface Asset {
  id: string
  name: string
  type: string
  status: string
  serialNumber?: string
  purchaseDate?: string
  notes?: string
  location: Location
  project?: Project
  assignedTo?: User
  maintenanceLogs?: MaintenanceLog[]
  transactions?: Transaction[]
  documents?: Document[]
  currentLevel?: number
}

export interface Location {
  id: string
  buildingId: string
  areaId?: string
  rackId?: string
  cabinetId?: string
  roomId?: string
  name?: string
}

export interface LocationDetails {
  id: string
  name: string
  type: 'Building' | 'Area' | 'Rack' | 'Cabinet'
  parentId?: string
  description?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface MaintenanceLog {
  id: string
  type: string
  date: string
  description: string
  assetId: string
  performedBy?: User
}

export interface Transaction {
  id: string
  type: string
  date: string
  description: string
  assetId: string
  userId?: string
}

export interface Document {
  id: string
  name: string
  uploadDate: string
  assetId: string
  uploadedBy?: string
  fileUrl: string
}

export interface Project {
  id: string
  name: string
  description?: string
}

export interface AssetUpdateInput {
  name?: string
  type?: string
  status?: string
  serialNumber?: string | null
  purchaseDate?: string | null
  notes?: string | null
  locationId?: string | null
  projectId?: string | null
  assignedToId?: string | null
  currentLevel?: number | null
} 