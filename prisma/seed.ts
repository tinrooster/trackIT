import { PrismaClient, Role, AssetType, AssetStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean the database
  await prisma.maintenanceLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.consumable.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@kgo.com',
      role: Role.ADMIN,
    },
  });

  const engineer = await prisma.user.create({
    data: {
      name: 'Engineer User',
      email: 'engineer@kgo.com',
      role: Role.ENGINEER,
    },
  });

  // Create locations
  const mainStudio = await prisma.location.create({
    data: {
      name: 'Main Studio',
      type: 'STUDIO',
      description: 'Main production studio',
    },
  });

  const equipmentRoom = await prisma.location.create({
    data: {
      name: 'Equipment Room',
      type: 'STORAGE',
      description: 'Main equipment storage',
      parentLocationId: mainStudio.id,
    },
  });

  // Create assets
  const camera = await prisma.asset.create({
    data: {
      name: 'Sony FX6',
      type: AssetType.CAMERA,
      serialNumber: 'FX6-12345',
      barcode: 'CAM-FX6-001',
      status: AssetStatus.AVAILABLE,
      purchaseDate: new Date('2023-01-01'),
      warrantyExpiration: new Date('2025-01-01'),
      locationId: equipmentRoom.id,
      notes: 'Main production camera',
    },
  });

  const computer = await prisma.asset.create({
    data: {
      name: 'Edit Station 1',
      type: AssetType.COMPUTER,
      serialNumber: 'PC-54321',
      barcode: 'PC-EDIT-001',
      status: AssetStatus.AVAILABLE,
      purchaseDate: new Date('2023-02-15'),
      warrantyExpiration: new Date('2026-02-15'),
      locationId: mainStudio.id,
      notes: 'Main editing workstation',
    },
  });

  // Create consumables
  await prisma.consumable.create({
    data: {
      name: 'SDI Cables',
      quantity: 50,
      reorderLevel: 10,
      locationId: equipmentRoom.id,
    },
  });

  await prisma.consumable.create({
    data: {
      name: 'XLR Cables',
      quantity: 30,
      reorderLevel: 5,
      locationId: equipmentRoom.id,
    },
  });

  // Create some transactions
  await prisma.transaction.create({
    data: {
      type: 'CHECK_OUT',
      assetId: camera.id,
      userId: engineer.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Checked out for field production',
    },
  });

  // Create maintenance logs
  await prisma.maintenanceLog.create({
    data: {
      assetId: computer.id,
      performedById: admin.id,
      description: 'Annual system maintenance',
      date: new Date('2024-01-15'),
      nextMaintenanceDate: new Date('2025-01-15'),
      cost: 150.00,
    },
  });

  console.log('Database has been seeded! 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 