export interface Asset {
  id: string
  name: string
  type: string
  status: string
  serialNumber?: string
  purchaseDate?: string
  notes?: string
  location: Location
  assignedTo?: User
  maintenanceLogs?: MaintenanceLog[]
  transactions?: Transaction[]
  documents?: Document[]
}

export interface Location {
  id: string
  name: string
  type: string
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