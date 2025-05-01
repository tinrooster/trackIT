import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const assetsRoute = createFileRoute('/assets')({
  component: AssetsPage,
})

function AssetsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Asset Management</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">Asset management interface coming soon...</p>
      </div>
    </div>
  )
} 