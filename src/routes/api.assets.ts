import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/lib/db'

export const Route = createFileRoute('/api/assets')({
  loader: async () => {
    try {
      const assets = await db.asset.findMany({
        include: {
          location: true,
          assignedTo: true,
        },
      })
      return { assets }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
      throw new Error('Failed to fetch assets')
    }
  },
  component: () => null,
}) 