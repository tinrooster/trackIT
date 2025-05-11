import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { assetService } from '../../services/asset.service';
import type { AssetCreateInput } from '../../services/asset.service';

const assetTypes = [
  'Hardware',
  'Software',
  'Equipment',
  'Tool',
  'Consumable',
  'Document',
  'Other'
];

const assetStatuses = [
  'Available',
  'In Use',
  'Maintenance',
  'Reserved',
  'Retired'
];

// TODO: Replace with actual API calls
const mockLocations = {
  buildings: [
    { id: 'b1', name: 'Main Building' },
    { id: 'b2', name: 'Storage Facility' }
  ],
  areas: [
    { id: 'a1', name: 'Studio A', buildingId: 'b1' },
    { id: 'a2', name: 'Studio B', buildingId: 'b1' },
    { id: 'a3', name: 'Storage Area 1', buildingId: 'b2' }
  ],
  racks: [
    { id: 'r1', name: 'Rack 1', areaId: 'a1' },
    { id: 'r2', name: 'Rack 2', areaId: 'a1' },
    { id: 'r3', name: 'Rack 1', areaId: 'a3' }
  ],
  cabinets: [
    { id: 'c1', name: 'Cabinet 1', rackId: 'r1' },
    { id: 'c2', name: 'Cabinet 2', rackId: 'r1' }
  ]
};

// TODO: Replace with actual API calls
const mockProjects = [
  { id: 'p1', name: 'News Production' },
  { id: 'p2', name: 'Sports Coverage' },
  { id: 'p3', name: 'Studio Upgrade' }
];

export function AddAssetForm() {
  const navigate = useNavigate();
  const createAssetMutation = assetService.useCreateAsset();
  const [error, setError] = React.useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = React.useState({
    buildingId: '',
    areaId: '',
    rackId: '',
    cabinetId: ''
  });

  const filteredAreas = React.useMemo(() => 
    mockLocations.areas.filter(area => area.buildingId === selectedLocation.buildingId),
    [selectedLocation.buildingId]
  );

  const filteredRacks = React.useMemo(() => 
    mockLocations.racks.filter(rack => rack.areaId === selectedLocation.areaId),
    [selectedLocation.areaId]
  );

  const filteredCabinets = React.useMemo(() => 
    mockLocations.cabinets.filter(cabinet => cabinet.rackId === selectedLocation.rackId),
    [selectedLocation.rackId]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const assetData: AssetCreateInput = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      status: formData.get('status') as string,
      serialNumber: formData.get('serialNumber') as string,
      barcode: formData.get('barcode') as string,
      location: {
        id: `${selectedLocation.buildingId}-${selectedLocation.areaId}-${selectedLocation.rackId}-${selectedLocation.cabinetId}`,
        buildingId: selectedLocation.buildingId,
        areaId: selectedLocation.areaId,
        rackId: selectedLocation.rackId,
        cabinetId: selectedLocation.cabinetId
      },
      project: mockProjects.find(p => p.id === formData.get('project')),
      inService: {
        status: true,
        startDate: new Date()
      },
      costs: {
        purchaseCost: parseFloat(formData.get('purchaseCost') as string) || 0,
        projectAllocation: [],
        maintenanceCosts: [],
        operationalCosts: []
      },
      notes: formData.get('notes') as string
    };

    try {
      await createAssetMutation.mutateAsync(assetData);
      navigate({ to: '/inventory' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error creating asset</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
          <select
            id="type"
            name="type"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select a type</option>
            {assetTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            name="status"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select a status</option>
            {assetStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700">Project</label>
          <select
            id="project"
            name="project"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select a project</option>
            {mockProjects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Serial Number</label>
          <input
            type="text"
            name="serialNumber"
            id="serialNumber"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">Barcode</label>
          <input
            type="text"
            name="barcode"
            id="barcode"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700">Location</legend>
            <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="building" className="block text-xs text-gray-500">Building</label>
                <select
                  id="building"
                  value={selectedLocation.buildingId}
                  onChange={(e) => setSelectedLocation(prev => ({
                    ...prev,
                    buildingId: e.target.value,
                    areaId: '',
                    rackId: '',
                    cabinetId: ''
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select building</option>
                  {mockLocations.buildings.map(building => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="area" className="block text-xs text-gray-500">Area</label>
                <select
                  id="area"
                  value={selectedLocation.areaId}
                  onChange={(e) => setSelectedLocation(prev => ({
                    ...prev,
                    areaId: e.target.value,
                    rackId: '',
                    cabinetId: ''
                  }))}
                  disabled={!selectedLocation.buildingId}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select area</option>
                  {filteredAreas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="rack" className="block text-xs text-gray-500">Rack</label>
                <select
                  id="rack"
                  value={selectedLocation.rackId}
                  onChange={(e) => setSelectedLocation(prev => ({
                    ...prev,
                    rackId: e.target.value,
                    cabinetId: ''
                  }))}
                  disabled={!selectedLocation.areaId}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select rack</option>
                  {filteredRacks.map(rack => (
                    <option key={rack.id} value={rack.id}>{rack.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cabinet" className="block text-xs text-gray-500">Cabinet</label>
                <select
                  id="cabinet"
                  value={selectedLocation.cabinetId}
                  onChange={(e) => setSelectedLocation(prev => ({
                    ...prev,
                    cabinetId: e.target.value
                  }))}
                  disabled={!selectedLocation.rackId}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select cabinet</option>
                  {filteredCabinets.map(cabinet => (
                    <option key={cabinet.id} value={cabinet.id}>{cabinet.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>
        </div>

        <div>
          <label htmlFor="purchaseCost" className="block text-sm font-medium text-gray-700">Purchase Cost</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="purchaseCost"
              id="purchaseCost"
              min="0"
              step="0.01"
              defaultValue="0.00"
              className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          id="notes"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate({ to: '/inventory' })}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createAssetMutation.isPending}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {createAssetMutation.isPending ? 'Creating...' : 'Create Asset'}
        </button>
      </div>
    </form>
  );
} 