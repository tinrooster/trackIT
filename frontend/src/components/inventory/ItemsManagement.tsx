import React from 'react'
import { useState } from 'react'
import { useInventory } from '../../hooks/useInventory'
import { InventoryItem, InventoryItemSchema } from '../../services/inventoryService'
import { QrScanner } from '@yudiel/react-qr-scanner'

interface Item {
  id: string
  name: string
  type: string
  quantity: number
  remainingQuantity: number
  unit: string
  location: string
  cost?: number
  budgetCode?: string
  barcode?: string
  manufacturer: string
  model: string
  color?: string
  specifications?: Record<string, any>
}

interface ItemsManagementProps {
  initialItems: Item[]
}

export const ItemsManagement: React.FC<ItemsManagementProps> = ({ initialItems }) => {
  const {
    items,
    loading,
    error,
    filters,
    setFilters,
    sort,
    setSort,
    saveItems,
    lookupBarcode
  } = useInventory()

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [form, setForm] = useState<Partial<InventoryItem>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isScanning, setIsScanning] = useState(false)

  const [items, setItems] = useState<InventoryItem[]>(initialItems)

  console.log('ItemsManagement rendering with items:', items)

  // Handle barcode scan
  const handleScan = async (barcode: string) => {
    setIsScanning(false)
    const itemData = await lookupBarcode(barcode)
    if (itemData) {
      setForm(prev => ({ ...prev, ...itemData, barcode }))
    }
  }

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(f => ({
      ...f,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  // Validate and save item
  const handleSave = async () => {
    try {
      const newItem = {
        ...form,
        id: editItem?.id || Date.now().toString(),
        lastModified: new Date().toISOString()
      }
      
      // Validate
      const validated = InventoryItemSchema.parse(newItem)
      
      // Update items
      const newItems = editItem
        ? items.map(i => i.id === editItem.id ? validated : i)
        : [...items, validated]
      
      await saveItems(newItems)
      setModalOpen(false)
      setEditItem(null)
      setForm({})
      setFormErrors({})
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        err.errors.forEach(error => {
          if (error.path) {
            errors[error.path[0]] = error.message
          }
        })
        setFormErrors(errors)
      }
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="container mx-auto">
      <div className="mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => {
            setModalOpen(true)
            setEditItem(null)
            setForm({})
            setFormErrors({})
          }}
        >
          Add New Item
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.name} {item.color && `- ${item.color}`}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.remainingQuantity}/{item.quantity} {item.unit}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">${item.cost?.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className="text-blue-600 hover:text-blue-900 mr-2"
                    onClick={() => {
                      setModalOpen(true)
                      setEditItem(item)
                      setForm(item)
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={() => {
                      const newItems = items.filter(i => i.id !== item.id)
                      setItems(newItems)
                      saveItems(newItems)
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Modal with Scanning */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editItem ? 'Edit Item' : 'Add New Item'}
            </h3>

            {/* Barcode Scanner */}
            {!editItem && (
              <div className="mb-4">
                {isScanning ? (
                  <div className="aspect-video">
                    <QrScanner
                      onDecode={handleScan}
                      onError={(error) => console.log(error?.message)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setIsScanning(true)}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded mb-4"
                  >
                    Scan Barcode/QR
                  </button>
                )}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3">
              {/* Basic Info */}
              <div>
                <input
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  placeholder="Name"
                  className={`w-full border rounded px-3 py-2 ${
                    formErrors.name ? 'border-red-500' : ''
                  }`}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm">{formErrors.name}</p>
                )}
              </div>

              {/* Add all other fields similarly */}
              
              {/* Additional Fields */}
              <input
                name="manufacturer"
                value={form.manufacturer || ''}
                onChange={handleChange}
                placeholder="Manufacturer"
                className="w-full border rounded px-3 py-2"
              />
              
              <input
                name="model"
                value={form.model || ''}
                onChange={handleChange}
                placeholder="Model"
                className="w-full border rounded px-3 py-2"
              />

              <input
                name="serialNumber"
                value={form.serialNumber || ''}
                onChange={handleChange}
                placeholder="Serial Number"
                className="w-full border rounded px-3 py-2"
              />

              <input
                type="date"
                name="purchaseDate"
                value={form.purchaseDate || ''}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />

              <input
                type="date"
                name="warrantyExpiration"
                value={form.warrantyExpiration || ''}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />

              <textarea
                name="notes"
                value={form.notes || ''}
                onChange={handleChange}
                placeholder="Notes"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-200 px-4 py-2 rounded"
                onClick={() => {
                  setModalOpen(false)
                  setEditItem(null)
                  setForm({})
                  setFormErrors({})
                }}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 