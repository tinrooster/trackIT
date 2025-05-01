import { useAssets } from '@/hooks/queries/useAssets'

type Asset = {
  id: string
  name: string
  type: string
  status: string
  location: {
    name: string
  }
  assignedTo?: {
    name: string
  }
}

export function AssetList() {
  const { data, isLoading, error } = useAssets()
  const assets = data?.assets || []

  if (isLoading) {
    return <div>Loading assets...</div>
  }

  if (error) {
    return <div>Error loading assets: {(error as Error).message}</div>
  }

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-4">Assets</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset: Asset) => (
          <div
            key={asset.id}
            className="p-4 bg-white rounded-lg shadow"
          >
            <h3 className="text-lg font-semibold">{asset.name}</h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>Type: {asset.type}</p>
              <p>Status: {asset.status}</p>
              <p>Location: {asset.location.name}</p>
              {asset.assignedTo && (
                <p>Assigned to: {asset.assignedTo.name}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 