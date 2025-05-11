import { useState } from 'react'
import { Asset } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AssetDetailsProps {
  asset: Asset
  onClose: () => void
}

export function AssetDetails({ asset, onClose }: AssetDetailsProps) {
  const [activeTab, setActiveTab] = useState('info')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">{asset.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="mt-1">{asset.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="mt-1">{asset.location.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Assigned To</label>
                <p className="mt-1">{asset.assignedTo?.name || '-'}</p>
              </div>
              {asset.serialNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="mt-1">{asset.serialNumber}</p>
                </div>
              )}
              {asset.purchaseDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                  <p className="mt-1">{new Date(asset.purchaseDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {asset.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="mt-1 whitespace-pre-wrap">{asset.notes}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Maintenance History</h3>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Log Maintenance
              </button>
            </div>
            {asset.maintenanceLogs?.length ? (
              <div className="space-y-4">
                {asset.maintenanceLogs.map(log => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="font-medium">{log.type}</span>
                      <span className="text-gray-500">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-2 text-gray-600">{log.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No maintenance records found.</p>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <h3 className="text-lg font-semibold">Transaction History</h3>
            {asset.transactions?.length ? (
              <div className="space-y-4">
                {asset.transactions.map(transaction => (
                  <div key={transaction.id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="font-medium">{transaction.type}</span>
                      <span className="text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-600">{transaction.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No transaction history found.</p>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Documents</h3>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Upload Document
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {asset.documents?.map(doc => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{doc.name}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Added {new Date(doc.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            {!asset.documents?.length && (
              <p className="text-gray-500">No documents attached.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'available':
      return 'bg-green-100 text-green-800'
    case 'in_use':
      return 'bg-blue-100 text-blue-800'
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800'
    case 'offline':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
} 