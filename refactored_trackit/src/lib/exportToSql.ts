import { db } from './db';
import { getOfflineSettings } from './fallbackStorageService';
import { InventoryService } from '../services/inventoryService';

export async function exportOfflineDataToSql() {
  console.log('[Export] Starting export of offline data to SQL database...');
  let success = true;

  // Export Locations
  try {
    const { locations } = getOfflineSettings();
    for (const loc of locations) {
      // Only use valid fields for lookup
      const exists = await db.location.findFirst({
        where: { name: loc.name, type: loc.type },
      });
      if (!exists) {
        await db.location.create({
          data: {
            name: loc.name,
            type: loc.type,
          },
        });
        console.log(`[Export] Location exported: ${loc.name}`);
      }
    }
  } catch (err) {
    console.error('[Export] Error exporting locations:', err);
    success = false;
  }

  // Export Inventory Items (Assets)
  try {
    const items = await InventoryService.getItems();
    for (const item of items) {
      // Check if asset exists by name and serialNumber (if available)
      const exists = await db.asset.findFirst({
        where: {
          name: item.name,
          serialNumber: item.serialNumber || '',
        },
      });
      if (!exists) {
        // Find location by name to get id for connect
        let locationConnect = undefined;
        if (item.location) {
          const loc = await db.location.findFirst({ where: { name: item.location } });
          if (loc) {
            locationConnect = { connect: { id: loc.id } };
          } else {
            console.warn(`[Export] Asset '${item.name}' skipped: location '${item.location}' not found in SQL.`);
            continue;
          }
        }
        // Build asset data object, only including date fields if defined
        const assetData: any = {
          name: item.name,
          type: item.type,
          status: item.status,
          location: locationConnect,
          barcode: item.barcode || '',
          manufacturer: item.manufacturer || '',
          model: item.model || '',
          serialNumber: item.serialNumber || '',
          notes: item.notes || '',
        };
        if (item.purchaseDate) assetData.purchaseDate = new Date(item.purchaseDate);
        if (item.warrantyExpiration) assetData.warrantyExpiration = new Date(item.warrantyExpiration);
        await db.asset.create({ data: assetData });
        console.log(`[Export] Asset exported: ${item.name}`);
      }
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