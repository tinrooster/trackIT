// import { db } from './db';
import { getOfflineSettings } from './fallbackStorageService';
import { InventoryService } from '../services/inventoryService';

export async function exportOfflineDataToSql() {
  console.log('[Export] Starting export of offline data to SQL database...');
  let success = true;

  // Export Locations
  try {
    const { locations } = getOfflineSettings();
    for (const loc of locations) {
      // TODO: Implement SQL export logic for locations here
      // Example:
      // const exists = await db.location.findFirst({ where: { name: loc.name, type: loc.type } });
      // if (!exists) { await db.location.create({ data: { name: loc.name, type: loc.type } }); }
      console.log(`[Export] (Simulated) Location exported: ${loc.name}`);
    }
  } catch (err) {
    console.error('[Export] Error exporting locations:', err);
    success = false;
  }

  // Export Inventory Items (Assets)
  try {
    const items = await InventoryService.getItems();
    for (const item of items) {
      // TODO: Implement SQL export logic for assets here
      // Example:
      // const exists = await db.asset.findFirst({ where: { name: item.name, serialNumber: item.serialNumber || '' } });
      // if (!exists) { await db.asset.create({ data: assetData }); }
      console.log(`[Export] (Simulated) Asset exported: ${item.name}`);
    }
  } catch (err) {
    console.error('[Export] Error exporting inventory items:', err);
    success = false;
  }

  if (success) {
    console.log('[Export] Offline data export to SQL completed successfully.');
  } else {
    console.warn('[Export] Offline data export to SQL completed with errors.');
  }
} 