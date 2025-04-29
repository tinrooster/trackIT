import React, { useMemo } from 'react'
import { InventoryItem } from '@/types/inventory'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

interface CategorySummaryProps {
  items: InventoryItem[]
}

export function CategorySummary({ items }: CategorySummaryProps) {
  const navigate = useNavigate()

  const categoryData = useMemo(() => {
    // Group items by root category (first part of the path)
    const categoryGroups: Record<string, InventoryItem[]> = {}

    items.forEach(item => {
      // Get the root category (first part of the path) or use the category as is
      const category = item.category ? item.category.split('/')[0] : 'Uncategorized'
      if (!categoryGroups[category]) {
        categoryGroups[category] = []
      }
      categoryGroups[category].push(item)
    })

    // Calculate total items and quantities per category
    return Object.entries(categoryGroups).map(([category, categoryItems]) => ({
      name: category,
      itemCount: categoryItems.length,
      totalQuantity: categoryItems.reduce((sum, item) => sum + item.quantity, 0),
    }))
    .sort((a, b) => b.itemCount - a.itemCount) // Sort by item count descending
  }, [items])

  const handleCategoryClick = (category: string) => {
    // When clicking a root category, show all items in that category and its subcategories
    const categoryPrefix = `${category}/`
    navigate(`/inventory?category=${encodeURIComponent(category)}`)
  }

  return (
    <div className="space-y-4">
      {categoryData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No category data available. Assign categories to items in the inventory.
        </div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="itemCount" fill="#8884d8" name="Items" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Root Category Details</h3>
            <div className="grid gap-2">
              {categoryData.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer"
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <span className="font-medium">{category.name}</span>
                  <div className="text-sm text-muted-foreground">
                    {category.itemCount} items ({category.totalQuantity} units)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}