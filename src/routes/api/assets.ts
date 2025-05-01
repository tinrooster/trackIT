import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/lib/db'

export const Route = createFileRoute('/api/assets')({
  loader: async ({ params }) => {
    try {
      if (params.id) {
        const asset = await db.asset.findUnique({
          where: { id: params.id },
          include: {
            location: true,
            assignedTo: true,
            transactions: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
            maintenanceLogs: {
              take: 5,
              orderBy: { date: 'desc' },
            },
          },
        })
        if (!asset) throw new Error('Asset not found')
        return { asset }
      }

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
  component: () => null, // API routes don't need to render anything
})

export async function action({ method, params, body }: { method: string; params: any; body?: any }) {
  switch (method) {
    case 'GET':
      if (params.id) {
        return getAssetById(params.id)
      }
      return getAssets(body)
    case 'POST':
      return createAsset(body)
    case 'PUT':
      if (!params.id) throw new Error('Asset ID is required')
      return updateAsset(params.id, body)
    case 'DELETE':
      if (!params.id) throw new Error('Asset ID is required')
      return deleteAsset(params.id)
    default:
      throw new Error(`Method ${method} not supported`)
  }
}

async function getAssets(params?: {
  status?: string
  type?: string
  locationId?: string
}) {
  try {
    const assets = await db.asset.findMany({
      where: {
        status: params?.status,
        type: params?.type,
        locationId: params?.locationId,
      },
      include: {
        location: true,
        assignedTo: true,
      },
    })
    return assets
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    throw new Error('Failed to fetch assets')
  }
}

async function getAssetById(id: string) {
  try {
    const asset = await db.asset.findUnique({
      where: { id },
      include: {
        location: true,
        assignedTo: true,
        transactions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        maintenanceLogs: {
          take: 5,
          orderBy: { date: 'desc' },
        },
      },
    })
    if (!asset) throw new Error('Asset not found')
    return asset
  } catch (error) {
    console.error(`Failed to fetch asset ${id}:`, error)
    throw new Error('Failed to fetch asset')
  }
}

async function createAsset(data: any) {
  try {
    return await db.asset.create({
      data,
      include: {
        location: true,
      },
    })
  } catch (error) {
    console.error('Failed to create asset:', error)
    throw new Error('Failed to create asset')
  }
}

async function updateAsset(id: string, data: any) {
  try {
    return await db.asset.update({
      where: { id },
      data,
      include: {
        location: true,
        assignedTo: true,
      },
    })
  } catch (error) {
    console.error(`Failed to update asset ${id}:`, error)
    throw new Error('Failed to update asset')
  }
}

async function deleteAsset(id: string) {
  try {
    await db.asset.delete({
      where: { id },
    })
  } catch (error) {
    console.error(`Failed to delete asset ${id}:`, error)
    throw new Error('Failed to delete asset')
  }
}
