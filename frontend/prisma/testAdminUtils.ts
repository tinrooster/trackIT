import { upsertEntity, reorderEntities } from './adminEntityUtils';

async function test() {
  // Create a new location
  const loc = await upsertEntity('location', { name: 'Test Location', type: 'WAREHOUSE', description: 'Test', parentLocationId: null });
  console.log('Created location:', loc);

  // Create a new project
  const proj = await upsertEntity('project', { name: 'Test Project', status: 'ACTIVE' });
  console.log('Created project:', proj);

  // Reorder (example with just one id for demo)
  await reorderEntities('location', [loc.id]);
  await reorderEntities('project', [proj.id]);
}

test().then(() => process.exit(0));
