import * as React from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useEffect, useState } from 'react';

export function AssetList() {
  const [assets, setAssets] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    invoke('get_assets')
      .then((data) => setAssets(data as any[]))
      .catch((err) => setError(err.toString()));
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!assets.length) return <div>Loading...</div>;

  return (
    <ul>
      {assets.map((asset) => (
        <li key={asset.id}>
          {asset.name} ({asset.type_}) - {asset.status}
        </li>
      ))}
    </ul>
  );
} 