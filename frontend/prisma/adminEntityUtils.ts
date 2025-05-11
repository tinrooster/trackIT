import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

type EntityType = 'location' | 'project';

export async function upsertEntity(type: EntityType, data: any, id?: string) {
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

// Example: reorder by updating a custom 'order' field (add to your schema if needed)
export async function reorderEntities(type: EntityType, orderedIds: string[]) {
  if (type === 'location') {
    for (let i = 0; i < orderedIds.length; i++) {
      await prisma.location.update({ where: { id: orderedIds[i] }, data: { order: i } });
    }
  } else if (type === 'project') {
    for (let i = 0; i < orderedIds.length; i++) {
      await prisma.project.update({ where: { id: orderedIds[i] }, data: { order: i } });
    }
  }
}

// Example usage:
// await upsertEntity('location', { name: 'New Location', type: 'WAREHOUSE', description: 'A new warehouse', parentLocationId: null });
// await upsertEntity('project', { name: 'New Project', status: 'ACTIVE' });
// To edit: await upsertEntity('location', { name: 'Updated Name' }, existingId);
// To reorder: await reorderEntities('location', [id1, id2, id3]); 