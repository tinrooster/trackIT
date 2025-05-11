import { PrismaClient } from '@prisma/client';
import { Roles, AssetStatuses, AssetTypes, OSVersions, AdobeVersions, AJAVersions } from './types';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.maintenancelog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.consumable.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  // Create Locations
  const pcr1 = await prisma.location.create({
    data: {
      name: 'PCR1',
      type: 'PRODUCTION',
      description: 'Production Control Room 1'
    }
  });

  const engineering = await prisma.location.create({
    data: {
      name: 'Engineering',
      type: 'WORKSPACE',
      description: 'Engineering Department'
    }
  });

  const field = await prisma.location.create({
    data: {
      name: 'FIELD',
      type: 'MOBILE',
      description: 'Field Operations'
    }
  });

  const testBench = await prisma.location.create({
    data: {
      name: 'TEST_BENCH',
      type: 'MAINTENANCE',
      description: 'Test and Repair Bench'
    }
  });

  // Create Users (Photographers)
  const alexGray = await prisma.user.create({
    data: {
      name: 'Alex Gray',
      email: 'alex.w.gray.-nd@abc.com',
      role: Roles.PHOTOGRAPHER
    }
  });

  const deanSmith = await prisma.user.create({
    data: {
      name: 'Dean Smith',
      email: 'dean.c.smith@abc.com',
      role: Roles.PHOTOGRAPHER
    }
  });

  const williamThompson = await prisma.user.create({
    data: {
      name: 'William Thompson',
      email: 'william.s.thompson@abc.com',
      role: Roles.PHOTOGRAPHER
    }
  });

  const brianYuen = await prisma.user.create({
    data: {
      name: 'Brian Yuen',
      email: 'brian.x.yuen@abc.com',
      role: Roles.PHOTOGRAPHER
    }
  });

  // Create Mobile Units
  const mobileUnits = await Promise.all([
    // M3
    prisma.asset.create({
      data: {
        name: 'ow-casf-mu03a',
        type: AssetTypes.MOBILE_UNIT,
        serialNumber: 'S06612',
        barcode: 'MU-03A',
        status: AssetStatuses.AVAILABLE,
        purchaseDate: new Date('2024-01-01'),
        notes: `M3 Unit
Phone: 672-9103
AJA: ${AJAVersions.V16_2_6}
OS: ${OSVersions.WIN11_22H2}
BIOS: 1.26
Image: CSlean_sysprep1`,
        locationId: field.id,
        assignedToId: alexGray.id
      }
    }),
    // M4
    prisma.asset.create({
      data: {
        name: 'ow-casf-mu4A',
        type: AssetTypes.MOBILE_UNIT,
        serialNumber: 'S06605',
        barcode: 'MU-04A',
        status: AssetStatuses.AVAILABLE,
        purchaseDate: new Date('2024-01-01'),
        notes: `M4 Unit
Phone: 672-9104
Adobe: ${AdobeVersions.ADOBE_22}, ${AdobeVersions.ADOBE_24}
AJA: ${AJAVersions.V17_1}
OS: ${OSVersions.WIN11_23H2}
BIOS: 1.31
Image: ZBook23H2_6605_sysprepBackup.tibx`,
        locationId: field.id,
        assignedToId: deanSmith.id
      }
    }),
    // M25 (4K screen)
    prisma.asset.create({
      data: {
        name: 'ow-casf-mu92a',
        type: AssetTypes.MOBILE_UNIT,
        serialNumber: 'S05474',
        barcode: 'MU-25A',
        status: AssetStatuses.AVAILABLE,
        purchaseDate: new Date('2024-01-01'),
        notes: `M25 Unit
Phone: 672-9125
Adobe: ${AdobeVersions.ADOBE_22}, ${AdobeVersions.ADOBE_24}
AJA: ${AJAVersions.V17_1}
OS: ${OSVersions.WIN11_22H2}
BIOS: 1.28
Image: ZBook_Wn11_Adobe2022_base.tibx
4K screen`,
        locationId: field.id,
        assignedToId: brianYuen.id
      }
    })
  ]);

  // Create Degraded/Offline Units
  const degradedUnits = await Promise.all([
    prisma.asset.create({
      data: {
        name: 'offline-unit-1',
        type: AssetTypes.MOBILE_UNIT,
        serialNumber: 'S06600',
        barcode: 'OFF-001',
        status: AssetStatuses.OFFLINE,
        purchaseDate: new Date('2023-01-01'),
        notes: '2 bad T-bolt ports',
        locationId: testBench.id
      }
    }),
    prisma.asset.create({
      data: {
        name: 'ow-casf-mu95',
        type: AssetTypes.MOBILE_UNIT,
        serialNumber: 'S06561',
        barcode: 'MU-95',
        status: AssetStatuses.DEGRADED,
        purchaseDate: new Date('2023-01-01'),
        notes: `M23 Unit
Phone: 672-9123
AJA: ${AJAVersions.V16_2_3}
OS: ${OSVersions.WIN11_21H2}
BIOS: 1.30
Offline BAD SD, Bad & flaky T-bolt ports`,
        locationId: testBench.id
      }
    })
  ]);

  // Create AJA IO Units
  const ajaUnits = await Promise.all([
    prisma.asset.create({
      data: {
        name: 'AJA-IO-M3',
        type: AssetTypes.AJA_IO,
        serialNumber: 'AJA-M3-001',
        barcode: 'AJA-M3-001',
        status: AssetStatuses.AVAILABLE,
        purchaseDate: new Date('2024-01-01'),
        notes: `Version: ${AJAVersions.V16_2_6}`,
        locationId: field.id
      }
    }),
    prisma.asset.create({
      data: {
        name: 'AJA-IO-M4',
        type: AssetTypes.AJA_IO,
        serialNumber: 'AJA-M4-001',
        barcode: 'AJA-M4-001',
        status: AssetStatuses.AVAILABLE,
        purchaseDate: new Date('2024-01-01'),
        notes: `Version: ${AJAVersions.V17_1}`,
        locationId: field.id
      }
    })
  ]);

  console.log('Database has been seeded with mobile unit test data');
}

// Utility function for admin to create or edit entities
type EntityType = 'location' | 'project';

async function upsertEntity(type: EntityType, data: any, id?: string) {
  const now = new Date();
  const entityId = id || crypto.randomUUID();
  const baseData = { ...data, id: entityId, updatedAt: now };
  if (type === 'location') {
    return prisma.location.upsert({
      where: { id: entityId },
      update: baseData,
      create: baseData,
    });
  } else if (type === 'project') {
    return prisma.project.upsert({
      where: { id: entityId },
      update: baseData,
      create: baseData,
    });
  }
  // Add more entity types as needed
}

// Example usage:
// await upsertEntity('location', { name: 'New Location', type: 'WAREHOUSE', description: 'A new warehouse', parentLocationId: null });
// await upsertEntity('project', { name: 'New Project', status: 'ACTIVE' });
// To edit: await upsertEntity('location', { name: 'Updated Name' }, existingId);
// To reorder, update a field like 'order' or similar in your schema.

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 