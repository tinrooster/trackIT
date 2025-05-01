import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'

interface Consumable {
  id: string
  name: string
  type: string
  totalQuantity: number
  remainingQuantity: number
  unit: string
  location: string
  lastUpdated: string
  cost?: number
  budgetCode?: string
}

export default function ConsumablesTracker() {
  const [consumables] = useState<Consumable[]>([
    {
      id: '1',
      name: 'Cat6 Cable',
      type: 'Network Cable',
      totalQuantity: 1000,
      remainingQuantity: 750,
      unit: 'feet',
      location: 'Storage Room A',
      lastUpdated: '2024-06-10',
      cost: 0.75,
      budgetCode: 'NET-2024'
    }
  ])

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Consumables Inventory</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Add New Item
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Cost/Unit</TableHead>
            <TableHead>Budget Code</TableHead>
            <TableHead>Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consumables.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.remainingQuantity}</TableCell>
              <TableCell>{item.totalQuantity}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>{item.location}</TableCell>
              <TableCell>${item.cost?.toFixed(2)}</TableCell>
              <TableCell>{item.budgetCode}</TableCell>
              <TableCell>{item.lastUpdated}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 