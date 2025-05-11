import { useState, useEffect, useMemo } from 'react'
import { InventoryItem, InventoryService } from '../services/inventoryService'

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    location: ''
  })
  const [sort, setSort] = useState({
    field: 'name' as keyof InventoryItem,
    direction: 'asc' as 'asc' | 'desc'
  })

  // Load items on mount
  useEffect(() => {
    loadItems()
  }, [])

  // Load items from storage
  const loadItems = async () => {
    try {
      setLoading(true)
      const loadedItems = await InventoryService.getItems()
      setItems(loadedItems)
      setError(null)
    } catch (err) {
      setError('Failed to load inventory items')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items]

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.barcode?.includes(searchLower) ||
        item.serialNumber?.includes(searchLower)
      )
    }
    if (filters.type) {
      result = result.filter(item => item.type === filters.type)
    }
    if (filters.status) {
      result = result.filter(item => item.status === filters.status)
    }
    if (filters.location) {
      result = result.filter(item => item.location === filters.location)
    }

    // Apply sort
    result.sort((a, b) => {
      const aVal = a[sort.field]
      const bVal = b[sort.field]
      if (aVal === bVal) return 0
      const comparison = aVal < bVal ? -1 : 1
      return sort.direction === 'asc' ? comparison : -comparison
    })

    return result
  }, [items, filters, sort])

  // Save items to storage
  const saveItems = async (newItems: InventoryItem[]) => {
    try {
      await InventoryService.saveItems(newItems)
      setItems(newItems)
      setError(null)
    } catch (err) {
      setError('Failed to save inventory items')
      console.error(err)
    }
  }

  // Lookup barcode
  const lookupBarcode = async (barcode: string) => {
    try {
      return await InventoryService.lookupBarcode(barcode)
    } catch (err) {
      setError('Failed to lookup barcode')
      console.error(err)
      return null
    }
  }

  return {
    items: filteredAndSortedItems,
    loading,
    error,
    filters,
    setFilters,
    sort,
    setSort,
    saveItems,
    lookupBarcode
  }
} 