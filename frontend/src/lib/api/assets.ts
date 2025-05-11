import { db } from '@/lib/db'

export async function getAssets(params?: {
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
    return { assets }
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    throw new Error('Failed to fetch assets')
  }
}

export async function getAssetById(id: string) {
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
    return { asset }
  } catch (error) {
    console.error(`Failed to fetch asset ${id}:`, error)
    throw new Error('Failed to fetch asset')
  }
}

export async function createAsset(data: any) {
  try {
    const asset = await db.asset.create({
      data,
      include: {
        location: true,
      },
    })
    return { asset }
  } catch (error) {
    console.error('Failed to create asset:', error)
    throw new Error('Failed to create asset')
  }
}

export async function updateAsset(id: string, data: any) {
  try {
    const asset = await db.asset.update({
      where: { id },
      data,
      include: {
        location: true,
        assignedTo: true,
      },
    })
    return { asset }
  } catch (error) {
    console.error(`Failed to update asset ${id}:`, error)
    throw new Error('Failed to update asset')
  }
}

export async function deleteAsset(id: string) {
  try {
    await db.asset.delete({
      where: { id },
    })
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete asset ${id}:`, error)
    throw new Error('Failed to delete asset')
  }
} 